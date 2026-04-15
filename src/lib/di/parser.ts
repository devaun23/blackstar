// Divine Intervention episode markdown parser
// Extracts typed evidence items from episode markdown files.
//
// Content patterns detected:
//   - trigger -> association (clinical pearls)
//   - Tx? / Treatment: (treatment protocols)
//   - MOA: / C/I: (pharmacology)
//   - #1 RF / MCC / MCCOD (risk factors)
//   - Markdown tables (comparison tables)
//   - Mnemonic patterns in quotes or parenthetical acronyms
//   - DDx: lists (diagnostic criteria)
//   - Pathophys? (pathophysiology)
//
// Catch-all: clinical_pearl for unclassified content.

import type { ParsedEpisode, ParsedEvidenceItem, DIItemType } from './types';
import { resolveTopics } from './topic-map';

// ─── YAML Frontmatter Parser ───

interface Frontmatter {
  episode: number;
  title: string;
  shelf: string | null;
  topics: string[];
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error('No YAML frontmatter found');
  }

  const yamlBlock = fmMatch[1];
  const body = fmMatch[2];

  // Simple YAML parser — supports both DI (episode/title) and IC (section/subsection) formats
  const episode = parseInt(yamlBlock.match(/episode:\s*(\d+)/)?.[1] ?? '0', 10);
  const title =
    yamlBlock.match(/title:\s*"([^"]+)"/)?.[1] ??
    yamlBlock.match(/subsection:\s*"([^"]+)"/)?.[1] ??
    yamlBlock.match(/subsection:\s*(.+)/)?.[1]?.trim() ??
    '';
  const shelf = yamlBlock.match(/shelf:\s*(\S+)/)?.[1] ?? null;

  const topicsMatch = yamlBlock.match(/topics:\s*\[([^\]]*)\]/);
  const topics = topicsMatch
    ? topicsMatch[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''))
    : [];

  return {
    frontmatter: { episode, title, shelf, topics },
    body,
  };
}

// ─── Section Splitter ───

interface Section {
  heading: string;
  level: number;          // 1 for #, 2 for ##
  lines: string[];
}

function splitSections(body: string): Section[] {
  const lines = body.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h1 = line.match(/^# (.+)$/);
    const h2 = line.match(/^## (.+)$/);

    if (h1) {
      if (current && current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      current = { heading: h1[1].trim(), level: 1, lines: [] };
    } else if (h2) {
      if (current && current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      // Subsection inherits parent heading context
      const parentHeading: string = (current !== null && current.level === 1) ? current.heading : '';
      const fullHeading: string = parentHeading ? `${parentHeading} > ${h2[1].trim()}` : h2[1].trim();
      current = { heading: fullHeading, level: 2, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current && current.lines.some((l) => l.trim())) {
    sections.push(current);
  }

  return sections;
}

// ─── Line Classifiers ───

const ARROW_RE = /(.+?)\s*(?:->|→)\s*(.+)/;
const TX_RE = /^(?:Tx\??:?|Treatment\??:?)\s*(.+)/i;
const MOA_RE = /^MOA\??:?\s*(.+)/i;
const CI_RE = /^C\/I\??:?\s*(.+)/i;
const RF_RE = /^(?:#1 RF|MCC|MCCOD|Most common cause|Most common)\s+(?:of\s+|for\s+)?(.+)/i;
const DX_RE = /^(?:Dx\??:?|Diagnosis\??:?)\s*(.+)/i;
const NBS_RE = /^(?:NBS\??:?|Next best step\??:?)\s*(.+)/i;
const PATHO_RE = /^(?:Pathophys\??:?|Pathophysiology\??:?)\s*(.+)/i;
const MNEMONIC_RE = /\b[A-Z]{2,}\b.*?=|mnemonic/i;
const TABLE_RE = /^\|/;
const DDX_RE = /^DDx:?\s*/i;
const QUESTION_ANSWER_RE = /^(.+\?)\s*(.+)$/;

function classifyLine(line: string): DIItemType {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('-')) {
    // Sub-bullets are context for the preceding line, classified by parent
    return 'clinical_pearl';
  }
  if (TABLE_RE.test(trimmed)) return 'comparison_table';
  if (RF_RE.test(trimmed)) return 'risk_factor';
  if (TX_RE.test(trimmed)) return 'treatment_protocol';
  if (MOA_RE.test(trimmed)) return 'pharmacology';
  if (CI_RE.test(trimmed)) return 'pharmacology';
  if (PATHO_RE.test(trimmed)) return 'pathophysiology';
  if (MNEMONIC_RE.test(trimmed) && trimmed.length < 200) return 'mnemonic';
  if (DX_RE.test(trimmed)) return 'diagnostic_criterion';
  return 'clinical_pearl';
}

// ─── Item Extraction ───

function extractTriggerAssociation(text: string): {
  trigger: string | null;
  association: string | null;
} {
  const match = text.match(ARROW_RE);
  if (match) {
    return { trigger: match[1].trim(), association: match[2].trim() };
  }
  return { trigger: null, association: null };
}

function normalizeClaim(line: string, subLines: string[]): string {
  // Build a single-sentence claim from the main line + key sub-bullets
  let claim = line.trim();
  // Remove markdown bullet prefix
  claim = claim.replace(/^[-*]\s+/, '');
  // Append important sub-bullets (max 2 for conciseness)
  const importantSubs = subLines
    .filter((l) => l.trim() && !l.trim().startsWith('Note:'))
    .slice(0, 2)
    .map((l) => l.trim().replace(/^[-*]\s+/, ''));
  if (importantSubs.length > 0) {
    claim += ' | ' + importantSubs.join(' | ');
  }
  return claim;
}

/**
 * Group consecutive lines that belong together:
 * A non-blank, non-sub-bullet line followed by its indented/bulleted children.
 */
function groupLines(lines: string[]): Array<{ main: string; children: string[] }> {
  const groups: Array<{ main: string; children: string[] }> = [];
  let current: { main: string; children: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Blank line terminates current group
      if (current) {
        groups.push(current);
        current = null;
      }
      continue;
    }

    const isChild = line.startsWith('  ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');

    if (isChild && current) {
      current.children.push(trimmed);
    } else {
      if (current) groups.push(current);
      current = { main: trimmed, children: [] };
    }
  }
  if (current) groups.push(current);
  return groups;
}

/**
 * Parse a markdown table into comparison_table items.
 */
function parseTable(lines: string[]): ParsedEvidenceItem[] {
  const tableLines = lines.filter((l) => l.trim().startsWith('|'));
  if (tableLines.length < 2) return [];

  const rawText = tableLines.join('\n');
  const claim = `Comparison table: ${tableLines[0].replace(/\|/g, ' ').trim()}`;

  // Try to extract structured differential from table rows
  const headerCells = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean);
  const differential: Array<{ condition: string; features: string }> = [];

  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i].split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      differential.push({ condition: cells[0], features: cells.slice(1).join('; ') });
    }
  }

  return [{
    item_type: 'comparison_table',
    section_heading: '', // Filled by caller
    claim,
    raw_text: rawText,
    trigger_presentation: null,
    association: null,
    differential: differential.length > 0 ? differential : null,
    mnemonic_text: null,
    topic_tags: [], // Filled by caller
    shelf: null,
  }];
}

// ─── Main Parse Function ───

/**
 * Parse a markdown source file into structured evidence items.
 * Works with both DI (episode-numbered) and IC (section-based) frontmatter.
 * For IC files, pass episodeNumberOverride since the frontmatter lacks an episode field.
 */
export function parseEpisode(content: string, sourceFile: string, episodeNumberOverride?: number): ParsedEpisode {
  const { frontmatter, body } = parseFrontmatter(content);
  const sections = splitSections(body);
  const allItems: ParsedEvidenceItem[] = [];

  for (const section of sections) {
    const topicTags = resolveTopics(section.heading, frontmatter.topics);

    // Check for table content first
    const tableLines = section.lines.filter((l) => l.trim().startsWith('|'));
    if (tableLines.length >= 3) {
      const tableItems = parseTable(tableLines);
      for (const item of tableItems) {
        item.section_heading = section.heading;
        item.topic_tags = topicTags;
        item.shelf = frontmatter.shelf;
        allItems.push(item);
      }
    }

    // Process non-table lines
    const nonTableLines = section.lines.filter((l) => !l.trim().startsWith('|'));
    const groups = groupLines(nonTableLines);

    for (const group of groups) {
      const mainTrimmed = group.main.trim();
      if (!mainTrimmed) continue;
      // Skip separator/header-like lines
      if (mainTrimmed.startsWith('---') || mainTrimmed.startsWith('===')) continue;

      const itemType = classifyLine(mainTrimmed);
      const { trigger, association } = extractTriggerAssociation(mainTrimmed);
      const claim = normalizeClaim(group.main, group.children);
      const rawText = [group.main, ...group.children].join('\n');

      // Extract mnemonic text if applicable
      let mnemonicText: string | null = null;
      if (itemType === 'mnemonic') {
        const quotedMatch = mainTrimmed.match(/"([^"]+)"/);
        const acronymMatch = mainTrimmed.match(/\b([A-Z]{2,})\b/);
        mnemonicText = quotedMatch?.[1] ?? acronymMatch?.[1] ?? mainTrimmed;
      }

      allItems.push({
        item_type: itemType,
        section_heading: section.heading,
        claim,
        raw_text: rawText,
        trigger_presentation: trigger,
        association,
        differential: null,
        mnemonic_text: mnemonicText,
        topic_tags: topicTags,
        shelf: frontmatter.shelf,
      });
    }
  }

  return {
    episode_number: episodeNumberOverride ?? frontmatter.episode,
    title: frontmatter.title,
    shelf: frontmatter.shelf,
    topic_tags: frontmatter.topics,
    source_file: sourceFile,
    items: allItems,
  };
}
