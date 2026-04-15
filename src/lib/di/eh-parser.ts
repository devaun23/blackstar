// Emma Holliday IM Review parser
// Extracts typed evidence items from section markdown files.
//
// Content patterns detected:
//   - trigger -> association (clinical pearls, buzzword associations)
//   - "If X? -> Y" question-answer format
//   - Tx / Treatment: (treatment protocols)
//   - MOA: / C/I: (pharmacology)
//   - #1 RF / MCC / MCCOD (risk factors)
//   - Markdown tables (comparison tables)
//   - DDx: / Dx: (diagnostic criteria)
//   - Pathophys: (pathophysiology)
//   - Mnemonics (MUDPILES, AEIOU, etc.)
//
// Catch-all: clinical_pearl for unclassified content.

import type { ParsedEpisode, ParsedEvidenceItem, DIItemType } from './types';
import { resolveTopics } from './topic-map';

// ─── YAML Frontmatter Parser ───

interface EHFrontmatter {
  section: number;
  title: string;
  shelf: string | null;
  topics: string[];
}

function parseFrontmatter(content: string): { frontmatter: EHFrontmatter; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error('No YAML frontmatter found');
  }

  const yamlBlock = fmMatch[1];
  const body = fmMatch[2];

  const section = parseInt(yamlBlock.match(/section:\s*(\d+)/)?.[1] ?? '0', 10);
  const title = yamlBlock.match(/title:\s*"([^"]+)"/)?.[1] ?? '';
  const shelf = yamlBlock.match(/shelf:\s*(\S+)/)?.[1] ?? null;

  const topicsMatch = yamlBlock.match(/topics:\s*\[([^\]]*)\]/);
  const topics = topicsMatch
    ? topicsMatch[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''))
    : [];

  return {
    frontmatter: { section, title, shelf, topics },
    body,
  };
}

// ─── Section Splitter ───

interface Section {
  heading: string;
  lines: string[];
}

function splitSections(body: string): Section[] {
  const lines = body.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);

    if (h2) {
      if (current && current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      current = { heading: h2[1].trim(), lines: [] };
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
const RF_RE = /^(?:#1 RF|MCC|MCCOD|Most common cause|Most common|MC cause)\s+(?:of\s+|for\s+)?(.+)/i;
const DX_RE = /^(?:Dx\??:?|Diagnosis\??:?|Best (?:1st )?test\??:?|Next best (?:step|test)\??:?)\s*(.+)/i;
const PATHO_RE = /^(?:Pathophys\??:?|Pathophysiology\??:?)\s*(.+)/i;
const MNEMONIC_RE = /\b[A-Z]{2,}\b.*?=|mnemonic|MUDPILES|AEIOU/i;
const TABLE_RE = /^\|/;

function classifyLine(line: string): DIItemType {
  const trimmed = line.trim();
  if (!trimmed) return 'clinical_pearl';
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
 * Group consecutive lines: a non-blank line followed by its indented children.
 */
function groupLines(lines: string[]): Array<{ main: string; children: string[] }> {
  const groups: Array<{ main: string; children: string[] }> = [];
  let current: { main: string; children: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) {
        groups.push(current);
        current = null;
      }
      continue;
    }

    // Detect child lines: indented or sub-bullets under a main bullet
    const isMainBullet = trimmed.startsWith('- ') && !line.startsWith('  ');
    const isChild = (line.startsWith('  ') || (trimmed.startsWith('- ') && line.startsWith('  '))) && current !== null;

    if (isMainBullet && !line.startsWith('  ')) {
      if (current) groups.push(current);
      current = { main: trimmed, children: [] };
    } else if (isChild && current) {
      current.children.push(trimmed);
    } else {
      // Non-bullet line (e.g., plain text) — treat as new main
      if (current) groups.push(current);
      current = { main: trimmed, children: [] };
    }
  }
  if (current) groups.push(current);
  return groups;
}

/**
 * Parse markdown table rows into a comparison_table item.
 */
function parseTable(lines: string[], sectionHeading: string, topicTags: string[], shelf: string | null): ParsedEvidenceItem[] {
  const tableLines = lines.filter((l) => l.trim().startsWith('|'));
  if (tableLines.length < 2) return [];

  const rawText = tableLines.join('\n');
  const claim = `Comparison table: ${tableLines[0].replace(/\|/g, ' ').trim()}`;

  const differential: Array<{ condition: string; features: string }> = [];
  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i].split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      differential.push({ condition: cells[0], features: cells.slice(1).join('; ') });
    }
  }

  return [{
    item_type: 'comparison_table',
    section_heading: sectionHeading,
    claim,
    raw_text: rawText,
    trigger_presentation: null,
    association: null,
    differential: differential.length > 0 ? differential : null,
    mnemonic_text: null,
    topic_tags: topicTags,
    shelf,
  }];
}

// ─── Main Parse Function ───

export function parseEHSection(content: string, sourceFile: string): ParsedEpisode {
  const { frontmatter, body } = parseFrontmatter(content);
  const sections = splitSections(body);
  const allItems: ParsedEvidenceItem[] = [];

  for (const section of sections) {
    const topicTags = resolveTopics(section.heading, frontmatter.topics);

    // Check for table content
    const tableLines = section.lines.filter((l) => l.trim().startsWith('|'));
    if (tableLines.length >= 3) {
      const tableItems = parseTable(tableLines, section.heading, topicTags, frontmatter.shelf);
      allItems.push(...tableItems);
    }

    // Process non-table lines
    const nonTableLines = section.lines.filter((l) => !l.trim().startsWith('|'));
    const groups = groupLines(nonTableLines);

    for (const group of groups) {
      const mainTrimmed = group.main.trim();
      if (!mainTrimmed) continue;
      if (mainTrimmed.startsWith('---') || mainTrimmed.startsWith('===')) continue;
      // Skip table separator lines that leaked through
      if (/^\|[-\s|]+\|$/.test(mainTrimmed)) continue;

      const itemType = classifyLine(mainTrimmed);
      const { trigger, association } = extractTriggerAssociation(mainTrimmed);
      const claim = normalizeClaim(group.main, group.children);
      const rawText = [group.main, ...group.children].join('\n');

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
    episode_number: frontmatter.section,
    title: frontmatter.title,
    shelf: frontmatter.shelf,
    topic_tags: frontmatter.topics,
    source_file: sourceFile,
    items: allItems,
  };
}
