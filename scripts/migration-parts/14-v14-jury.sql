-- v14: Multi-model jury architecture support
-- Adds jury tracking columns to validator_report and pipeline_run

-- Track whether a validator report was produced by jury consensus
ALTER TABLE validator_report
  ADD COLUMN IF NOT EXISTS jury_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS jury_verdict jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS jury_agreement text DEFAULT null;

-- Track jury config used for a pipeline run
ALTER TABLE pipeline_run
  ADD COLUMN IF NOT EXISTS jury_config jsonb DEFAULT null;

COMMENT ON COLUMN validator_report.jury_enabled IS 'Whether this report was produced by a multi-model jury';
COMMENT ON COLUMN validator_report.jury_verdict IS 'Individual juror reports and facilitator synthesis';
COMMENT ON COLUMN validator_report.jury_agreement IS 'How consensus was reached: unanimous_pass, unanimous_fail, facilitator_synthesized';
COMMENT ON COLUMN pipeline_run.jury_config IS 'Snapshot of jury configuration used for this run';
