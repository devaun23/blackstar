// NBME CCSS markdown parser
// Extracts typed evidence items from NBME Comprehensive Clinical Science Self-Assessment items.
//
// CCSS format:
//   ---
//   source: "NBME CCSS"
//   section: N
//   item: M
//   shelf: medicine
//   system: "infectious-disease"
//   topic: "latent-tuberculosis"
//   task_type: "management"
//   correct_answer: C
//   ---
//
//   # Item M — Title
//   ## Clinical Scenario
//   ## Decision Point          (optional, merges into case_presentation)
//   ## Options
//   ## Correct Answer: X
//   ## Educational Objective
//   ## Common Errors           (bulleted, one distractor_rule per bullet)
//   ## Key Teaching Points     (bulleted, one clinical_pearl per bullet)
//
// H2 → item_type mapping:
//   Clinical Scenario + Decision Point + Options → case_presentation (one item)
//   Correct Answer: X body → treatment_protocol (task_type=management) | diagnostic_criterion (else)
//   Educational Objective → clinical_pearl
//   Common Errors (per bullet) → distractor_rule
//   Key Teaching Points (per bullet) → clinical_pearl

import type { ParsedEpisode, ParsedEvidenceItem, DIItemType } from '../di/types';
import { resolveNbmeTopicTags } from './topic-map';

interface CCSSFrontmatter {
  source: string;
  section: number;
  item: number;
  shelf: string | null;
  system: string | null;
  topic: string | null;
  task_type: string | null;
  correct_answer: string | null;
}

function parseFrontmatter(content: string): { frontmatter: CCSSFrontmatter; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error('No YAML frontmatter found');
  }

  const yamlBlock = fmMatch[1];
  const body = fmMatch[2];

  const readString = (key: string): string | null => {
    const m = yamlBlock.match(new RegExp(`^${key}:\\s*"?([^"\\n]+?)"?$`, 'm'));
    return m ? m[1].trim() : null;
  };
  const readInt = (key: string): number => {
    const m = yamlBlock.match(new RegExp(`^${key}:\\s*(\\d+)`, 'm'));
    return m ? parseInt(m[1], 10) : 0;
  };

  return {
    frontmatter: {
      source: readString('source') ?? 'NBME CCSS',
      section: readInt('section'),
      item: readInt('item'),
      shelf: readString('shelf'),
      system: readString('system'),
      topic: readString('topic'),
      task_type: readString('task_type'),
      correct_answer: readString('correct_answer'),
    },
    body,
  };
}

interface H2Section {
  heading: string;    // normalized, lowercase trimmed without leading "## "
  rawHeading: string; // original heading line (to preserve "Correct Answer: C")
  lines: string[];
}

function splitH2Sections(body: string): H2Section[] {
  const sections: H2Section[] = [];
  const lines = body.split('\n');
  let current: H2Section | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (current) sections.push(current);
      current = {
        heading: h2Match[1].trim().toLowerCase().replace(/:.*$/, '').trim(),
        rawHeading: h2Match[1].trim(),
        lines: [],
      };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  return sections;
}

function nonBlank(lines: string[]): string[] {
  return lines.map((l) => l.trim()).filter((l) => l.length > 0);
}

function joinProse(lines: string[]): string {
  return nonBlank(lines).join(' ').replace(/\s+/g, ' ').trim();
}

/** Split bulleted list into individual bullet bodies. Handles "- ", "* ", "1. " prefixes. */
function splitBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  let current: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) {
      if (current.length > 0) {
        bullets.push(current.join(' ').trim());
        current = [];
      }
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      if (current.length > 0) {
        bullets.push(current.join(' ').trim());
      }
      current = [line.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '')];
    } else if (current.length > 0) {
      current.push(line);
    }
  }
  if (current.length > 0) bullets.push(current.join(' ').trim());

  return bullets.filter((b) => b.length > 0);
}

/** Truncate to ~200 chars for the `claim` field while preserving a full sentence where possible. */
function makeClaim(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastPeriod = slice.lastIndexOf('. ');
  if (lastPeriod > 80) return slice.slice(0, lastPeriod + 1);
  return slice.slice(0, max - 3) + '...';
}

/** Build evidence items from the parsed H2 sections. Returns items in reading order. */
function buildEvidenceItems(
  sections: H2Section[],
  frontmatter: CCSSFrontmatter,
  topicTags: string[],
): ParsedEvidenceItem[] {
  const items: ParsedEvidenceItem[] = [];
  const base = {
    trigger_presentation: null,
    association: null,
    differential: null,
    mnemonic_text: null,
    topic_tags: topicTags,
    shelf: frontmatter.shelf,
  };

  const scenario = sections.find((s) => s.heading === 'clinical scenario');
  const decision = sections.find((s) => s.heading === 'decision point');
  const options = sections.find((s) => s.heading === 'options');
  const correctAnswer = sections.find((s) => s.heading === 'correct answer');
  const objective = sections.find((s) => s.heading === 'educational objective');
  const errors = sections.find((s) => s.heading === 'common errors');
  const teaching = sections.find((s) => s.heading === 'key teaching points');

  // 1. case_presentation — scenario + decision + options bundled together
  if (scenario) {
    const parts: string[] = [];
    parts.push(joinProse(scenario.lines));
    if (decision) parts.push(`DECISION POINT: ${joinProse(decision.lines)}`);
    if (options) parts.push(`OPTIONS:\n${nonBlank(options.lines).join('\n')}`);

    const rawText = parts.join('\n\n');
    items.push({
      ...base,
      item_type: 'case_presentation',
      section_heading: 'Clinical Scenario',
      claim: makeClaim(joinProse(scenario.lines)),
      raw_text: rawText,
    });
  }

  // 2. Correct answer body → treatment_protocol (management) or diagnostic_criterion (else)
  if (correctAnswer) {
    const body = joinProse(correctAnswer.lines);
    if (body.length >= 20) {
      const type: DIItemType =
        frontmatter.task_type === 'management' ? 'treatment_protocol' : 'diagnostic_criterion';
      items.push({
        ...base,
        item_type: type,
        section_heading: correctAnswer.rawHeading,
        claim: makeClaim(body),
        raw_text: body,
      });
    }
  }

  // 3. Educational objective → clinical_pearl (single)
  if (objective) {
    const body = joinProse(objective.lines);
    if (body.length >= 20) {
      items.push({
        ...base,
        item_type: 'clinical_pearl',
        section_heading: 'Educational Objective',
        claim: makeClaim(body),
        raw_text: body,
      });
    }
  }

  // 4. Common errors → one distractor_rule per bullet
  if (errors) {
    const bullets = splitBullets(errors.lines);
    for (const bullet of bullets) {
      if (bullet.length < 20) continue;
      items.push({
        ...base,
        item_type: 'distractor_rule',
        section_heading: 'Common Errors',
        claim: makeClaim(bullet),
        raw_text: bullet,
      });
    }
  }

  // 5. Key teaching points → one clinical_pearl per bullet
  if (teaching) {
    const bullets = splitBullets(teaching.lines);
    for (const bullet of bullets) {
      if (bullet.length < 15) continue;
      items.push({
        ...base,
        item_type: 'clinical_pearl',
        section_heading: 'Key Teaching Points',
        claim: makeClaim(bullet),
        raw_text: bullet,
      });
    }
  }

  return items;
}

/**
 * Parse one NBME CCSS markdown file.
 * Returns a ParsedEpisode whose episode_number = section*1000 + item (so NBME
 * IDs are disjoint from DI episode numbers) and whose items carry source-less
 * fields; the ingest script attaches source='nbme' at upsert time.
 */
export function parseNbmeCcssItem(content: string, sourceFile: string): ParsedEpisode {
  const { frontmatter, body } = parseFrontmatter(content);

  if (frontmatter.section <= 0 || frontmatter.item <= 0) {
    throw new Error(`Missing section/item in frontmatter: section=${frontmatter.section}, item=${frontmatter.item}`);
  }

  const topicTags = resolveNbmeTopicTags(frontmatter);
  const sections = splitH2Sections(body);
  const items = buildEvidenceItems(sections, frontmatter, topicTags);

  // Title: grab the first H1, fall back to "NBME CCSS §X.M"
  const h1Match = body.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : `NBME CCSS §${frontmatter.section}.${frontmatter.item}`;

  return {
    episode_number: frontmatter.section * 1000 + frontmatter.item,
    title,
    shelf: frontmatter.shelf,
    topic_tags: topicTags,
    source_file: sourceFile,
    items,
  };
}
