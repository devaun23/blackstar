// AMBOSS article markdown parser
// Extracts typed evidence items from AMBOSS behavioral science articles.
//
// Content patterns detected:
//   - **Term**: definition (definition)
//   - Ordered lists under "approach"/"steps"/"procedure" headings (procedure_protocol)
//   - Lines with "must"/"required"/"prohibited" under ethics/law headings (legal_rule)
//   - Heading contains "types"/"classification" with list body (classification)
//   - Ethical principle names (autonomy, beneficence, etc.) (ethical_principle)
//   - Markdown tables (comparison_table)
//   - Treatment/drug dosing patterns (treatment_protocol / pharmacology)
//   - Catch-all: clinical_pearl

import type { ParsedEpisode, ParsedEvidenceItem, DIItemType } from '../di/types';
import { resolveTopicFromHeading, resolveTopicsFromTags } from './topic-map';

// ─── YAML Frontmatter Parser ───

interface Frontmatter {
  article_number: number;
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

  const article_number = parseInt(
    yamlBlock.match(/article_number:\s*(\d+)/)?.[1] ?? '0',
    10,
  );
  const title = yamlBlock.match(/title:\s*"([^"]+)"/)?.[1] ?? '';
  const shelf = yamlBlock.match(/shelf:\s*(\S+)/)?.[1] ?? null;

  const topicsMatch = yamlBlock.match(/topics:\s*\[([^\]]*)\]/);
  const topics = topicsMatch
    ? topicsMatch[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''))
    : [];

  return {
    frontmatter: { article_number, title, shelf, topics },
    body,
  };
}

// ─── Section Splitter (H1-H4 breadcrumb) ───

interface Section {
  heading: string; // Full breadcrumb: "Death > Brain Death > Apnea Testing"
  level: number;
  lines: string[];
}

function splitSections(body: string): Section[] {
  const lines = body.split('\n');
  const sections: Section[] = [];
  const headingStack: Array<{ level: number; text: string }> = [];
  let currentLines: string[] = [];

  function buildBreadcrumb(): string {
    return headingStack.map((h) => h.text).join(' > ');
  }

  function flushSection() {
    const contentLines = currentLines.filter((l) => l.trim().length > 0);
    if (contentLines.length > 0 && headingStack.length > 0) {
      sections.push({
        heading: buildBreadcrumb(),
        level: headingStack[headingStack.length - 1].level,
        lines: contentLines,
      });
    }
    currentLines = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      // Pop headings at same or deeper level
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, text });
    } else {
      currentLines.push(line);
    }
  }

  // Flush remaining
  flushSection();

  return sections;
}

// ─── Block Grouping ───
// Groups consecutive non-blank lines within a section into logical blocks.
// A new block starts when: blank line appears, or a new bold definition starts.

interface Block {
  lines: string[];
}

function groupBlocks(sectionLines: string[]): Block[] {
  const blocks: Block[] = [];
  let current: string[] = [];

  for (const line of sectionLines) {
    const trimmed = line.trim();

    // Blank line = block boundary
    if (trimmed.length === 0) {
      if (current.length > 0) {
        blocks.push({ lines: [...current] });
        current = [];
      }
      continue;
    }

    // New bold definition = start new block
    if (/^\*\*[^*]+\*\*\s*[:—]/.test(trimmed) && current.length > 0) {
      blocks.push({ lines: [...current] });
      current = [trimmed];
      continue;
    }

    current.push(trimmed);
  }

  if (current.length > 0) {
    blocks.push({ lines: [...current] });
  }

  return blocks;
}

// ─── Item Type Classification ───

const ETHICAL_PRINCIPLES = /\b(autonomy|beneficence|nonmaleficence|justice)\b/i;
const LEGAL_KEYWORDS =
  /\b(must|required|prohibited|illegal|obligat|mandate|authorized|shall not)\b/i;
const PROCEDURE_HEADING =
  /\b(approach|procedure|steps|donning|doffing|gowning|gloving|scrub|technique|instructions)\b/i;
const CLASSIFICATION_HEADING = /\b(types|classification|categories|levels|manners)\b/i;
const DEFINITION_LINE = /^\*\*[^*]+\*\*\s*[:—]/;
const TABLE_LINE = /^\|/;
const TREATMENT_KEYWORDS =
  /\b(first[- ]line|second[- ]line|treatment|pharmacotherapy|dosage|mg|mcg|titrate)\b/i;
const PHARMACOLOGY_KEYWORDS = /\b(mechanism of action|active against|sporicidal)\b/i;

function classifyBlock(
  heading: string,
  blockLines: string[],
): DIItemType {
  const text = blockLines.join(' ');
  const firstLine = blockLines[0] ?? '';

  // Table
  if (TABLE_LINE.test(firstLine)) return 'comparison_table';

  // Definition (bold term followed by colon or em dash)
  if (DEFINITION_LINE.test(firstLine)) return 'definition';

  // Ethical principle names in the text
  if (ETHICAL_PRINCIPLES.test(text) && /ethic|principle/i.test(heading)) {
    return 'ethical_principle';
  }

  // Legal rules (under law/ethics headings with legal keywords)
  if (
    /\b(law|legal|ethics|commitment|abortion|consent|hipaa|emtala)\b/i.test(heading) &&
    LEGAL_KEYWORDS.test(text)
  ) {
    return 'legal_rule';
  }

  // Procedure/protocol (heading signals + ordered list)
  if (PROCEDURE_HEADING.test(heading)) return 'procedure_protocol';

  // Classification (heading signals)
  if (CLASSIFICATION_HEADING.test(heading) && blockLines.length > 1) {
    return 'classification';
  }

  // Treatment protocol
  if (TREATMENT_KEYWORDS.test(text)) return 'treatment_protocol';

  // Pharmacology
  if (PHARMACOLOGY_KEYWORDS.test(text)) return 'pharmacology';

  // Catch-all
  return 'clinical_pearl';
}

// ─── Claim Normalization ───
// Extract a single declarative sentence from the block.

function normalizeClaim(blockLines: string[]): string {
  const firstLine = blockLines[0] ?? '';

  // For definitions, extract the term and first clause
  const defMatch = firstLine.match(/^\*\*([^*]+)\*\*\s*[:—]\s*(.+)/);
  if (defMatch) {
    const term = defMatch[1].trim();
    const def = defMatch[2].trim().replace(/\.$/, '');
    return `${term}: ${def}`;
  }

  // For bullet lists, take the first substantive line
  const cleanFirst = firstLine.replace(/^[-*\d.)\s]+/, '').trim();

  // If very short, append second line
  if (cleanFirst.length < 40 && blockLines.length > 1) {
    const second = blockLines[1].replace(/^[-*\d.)\s]+/, '').trim();
    return `${cleanFirst}. ${second}`.replace(/\.\./g, '.').replace(/\.$/, '');
  }

  // Truncate long claims
  if (cleanFirst.length > 200) {
    return cleanFirst.slice(0, 197) + '...';
  }

  return cleanFirst;
}

// ─── Main Parser ───

export function parseAmbossArticle(content: string, sourceFile: string): ParsedEpisode {
  const { frontmatter, body } = parseFrontmatter(content);
  const sections = splitSections(body);
  const articleTagTopics = resolveTopicsFromTags(frontmatter.topics);

  const items: ParsedEvidenceItem[] = [];

  for (const section of sections) {
    const blocks = groupBlocks(section.lines);
    const headingTopics = resolveTopicFromHeading(section.heading);

    for (const block of blocks) {
      // Skip very short blocks (noise)
      if (block.lines.join(' ').trim().length < 15) continue;

      const itemType = classifyBlock(section.heading, block.lines);
      const claim = normalizeClaim(block.lines);
      const rawText = block.lines.join('\n');

      // Topic resolution: heading-level > article-level tags
      const topicTags =
        headingTopics.length > 0 ? headingTopics : articleTagTopics;

      items.push({
        item_type: itemType,
        section_heading: section.heading,
        claim,
        raw_text: rawText,
        trigger_presentation: null,
        association: null,
        differential: null,
        mnemonic_text: null,
        topic_tags: topicTags,
        shelf: frontmatter.shelf,
      });
    }
  }

  return {
    episode_number: frontmatter.article_number,
    title: frontmatter.title,
    shelf: frontmatter.shelf,
    topic_tags: frontmatter.topics,
    source_file: sourceFile,
    items,
  };
}
