import type { VisualRequirementType } from '@/lib/factory/schemas/visual-specs';

export type AssetValidationStatus = 'unreviewed' | 'approved' | 'rejected' | 'needs_update';

export interface ImageAsset {
  asset_id: string;
  source: 'ptb_xl' | 'mimic_cxr' | 'openi' | 'creative_commons' | 'custom';
  license: string;
  license_allows_commercial: boolean;
  asset_type: VisualRequirementType;
  clinical_label: string;
  hinge_features: string[];
  topic_ids: string[];
  blueprint_node_ids?: string[];
  file_path?: string;
  original_source_url?: string;
  validation_status: AssetValidationStatus;
  validated_by?: string;
  validator_notes?: string;
}
