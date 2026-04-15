import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminKey } from '@/lib/supabase/admin';
import {
  blueprintNodes,
  errorTaxonomy,
  sourceRegistry,
  agentPrompts,
  contentSystems,
  contentCompetencies,
  contentDisciplines,
  contentTopics,
  systemToCodeMap,
  hingeClueTypes,
  actionClasses,
  alternateTerminology,
  confusionSets,
  transferRules,
} from '@/lib/factory/seeds';

/**
 * POST /api/factory/seed
 * Seeds the database with content outline, blueprint nodes, error taxonomy, source registry, and agent prompts.
 * Admin-protected via service role key check.
 *
 * Seeding order respects FK dependencies:
 * 1. content_system (no FKs)
 * 2. content_competency (no FKs)
 * 3. content_discipline (no FKs)
 * 4. content_topic (FK → content_system)
 * 5. blueprint_node (FK → content_system via content_system_id)
 * 6. error_taxonomy, source_registry, agent_prompt (no FK deps on above)
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (!verifyAdminKey(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Record<string, { upserted: number; errors: string[] }> = {};

  // 1. Seed content systems
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const system of contentSystems) {
      const { error } = await supabase
        .from('content_system')
        .upsert(system, { onConflict: 'code' });
      if (error) errors.push(`${system.code}: ${error.message}`);
      else upserted++;
    }
    results.content_systems = { upserted, errors };
  }

  // 2. Seed content competencies
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const comp of contentCompetencies) {
      const { error } = await supabase
        .from('content_competency')
        .upsert(comp, { onConflict: 'code' });
      if (error) errors.push(`${comp.code}: ${error.message}`);
      else upserted++;
    }
    results.content_competencies = { upserted, errors };
  }

  // 3. Seed content disciplines
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const disc of contentDisciplines) {
      const { error } = await supabase
        .from('content_discipline')
        .upsert(disc, { onConflict: 'code' });
      if (error) errors.push(`${disc.code}: ${error.message}`);
      else upserted++;
    }
    results.content_disciplines = { upserted, errors };
  }

  // 4. Seed content topics (need content_system IDs first)
  {
    const errors: string[] = [];
    let upserted = 0;

    // Fetch all content_system rows to resolve system_code → id
    const { data: systems } = await supabase
      .from('content_system')
      .select('id, code');

    const codeToId = new Map<string, string>();
    if (systems) {
      for (const s of systems) {
        codeToId.set(s.code, s.id);
      }
    }

    for (const topic of contentTopics) {
      const contentSystemId = codeToId.get(topic.system_code);
      if (!contentSystemId) {
        errors.push(`${topic.topic_name}: unknown system_code '${topic.system_code}'`);
        continue;
      }
      const { error } = await supabase
        .from('content_topic')
        .upsert(
          {
            content_system_id: contentSystemId,
            topic_name: topic.topic_name,
            category: topic.category,
            is_high_yield: topic.is_high_yield,
          },
          { onConflict: 'content_system_id,topic_name' }
        );
      if (error) errors.push(`${topic.topic_name}: ${error.message}`);
      else upserted++;
    }
    results.content_topics = { upserted, errors };
  }

  // 5. Seed blueprint nodes (enhanced to resolve content_system_id)
  {
    const errors: string[] = [];
    let upserted = 0;

    // Re-fetch content_system IDs for blueprint backfill
    const { data: systems } = await supabase
      .from('content_system')
      .select('id, code');

    const codeToId = new Map<string, string>();
    if (systems) {
      for (const s of systems) {
        codeToId.set(s.code, s.id);
      }
    }

    for (const node of blueprintNodes) {
      const systemCode = systemToCodeMap[node.system];
      const contentSystemId = systemCode ? codeToId.get(systemCode) : undefined;

      const payload: Record<string, unknown> = { ...node };
      if (contentSystemId) {
        payload.content_system_id = contentSystemId;
      }

      const { error } = await supabase
        .from('blueprint_node')
        .upsert(
          payload,
          { onConflict: 'shelf,topic,subtopic,task_type,clinical_setting,age_group' }
        );
      if (error) errors.push(`${node.topic}: ${error.message}`);
      else upserted++;
    }
    results.blueprint_nodes = { upserted, errors };
  }

  // 6. Seed error taxonomy
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const entry of errorTaxonomy) {
      const { error } = await supabase
        .from('error_taxonomy')
        .upsert(entry, { onConflict: 'error_name' });
      if (error) errors.push(`${entry.error_name}: ${error.message}`);
      else upserted++;
    }
    results.error_taxonomy = { upserted, errors };
  }

  // 7. Seed source registry
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const source of sourceRegistry) {
      const { error } = await supabase
        .from('source_registry')
        .upsert(source, { onConflict: 'name' });
      if (error) errors.push(`${source.name}: ${error.message}`);
      else upserted++;
    }
    results.source_registry = { upserted, errors };
  }

  // 8. Seed agent prompts
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const prompt of agentPrompts) {
      const { error } = await supabase
        .from('agent_prompt')
        .upsert(prompt, { onConflict: 'agent_type,version' });
      if (error) errors.push(`${prompt.agent_type}: ${error.message}`);
      else upserted++;
    }
    results.agent_prompts = { upserted, errors };
  }

  // 9. Seed hinge clue types
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const entry of hingeClueTypes) {
      const { error } = await supabase
        .from('hinge_clue_type')
        .upsert(entry, { onConflict: 'name' });
      if (error) errors.push(`${entry.name}: ${error.message}`);
      else upserted++;
    }
    results.hinge_clue_types = { upserted, errors };
  }

  // 10. Seed action classes
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const entry of actionClasses) {
      const { error } = await supabase
        .from('action_class')
        .upsert(entry, { onConflict: 'name' });
      if (error) errors.push(`${entry.name}: ${error.message}`);
      else upserted++;
    }
    results.action_classes = { upserted, errors };
  }

  // 11. Seed alternate terminology
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const entry of alternateTerminology) {
      const { error } = await supabase
        .from('alternate_terminology')
        .upsert(entry, { onConflict: 'nbme_phrasing,clinical_concept' });
      if (error) errors.push(`${entry.nbme_phrasing}: ${error.message}`);
      else upserted++;
    }
    results.alternate_terminology = { upserted, errors };
  }

  // 12. Seed confusion sets
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const cs of confusionSets) {
      const { error } = await supabase
        .from('confusion_sets')
        .upsert(
          {
            name: cs.name,
            conditions: cs.conditions,
            discriminating_clues: cs.discriminating_clues,
            common_traps: cs.common_traps,
          },
          { onConflict: 'name' }
        );
      if (error) errors.push(`${cs.name}: ${error.message}`);
      else upserted++;
    }
    results.confusion_sets = { upserted, errors };
  }

  // 13. Seed transfer rules
  {
    const errors: string[] = [];
    let upserted = 0;
    for (const tr of transferRules) {
      const { error } = await supabase
        .from('transfer_rules')
        .upsert(
          {
            rule_text: tr.rule_text,
            category: tr.category,
            trigger_pattern: tr.trigger_pattern,
            action_priority: tr.action_priority,
            suppressions: tr.suppressions,
            wrong_pathways: tr.wrong_pathways,
            topic: tr.contexts[0]?.topic ?? null,
            source_citation: tr.source_citation,
          },
          { onConflict: 'rule_text' }
        );
      if (error) errors.push(`${tr.rule_text.slice(0, 40)}: ${error.message}`);
      else upserted++;
    }
    results.transfer_rules = { upserted, errors };
  }

  const hasErrors = Object.values(results).some((r) => r.errors.length > 0);

  return NextResponse.json(
    { success: !hasErrors, results },
    { status: hasErrors ? 207 : 200 }
  );
}
