/**
 * Transfer test strategy: student has high mastery but got it wrong.
 *
 * This suggests they know the rule in the familiar context but can't
 * apply it in a new setting. Selection: same transfer rule,
 * different clinical_setting or age_group.
 *
 * Example: Student knows to check troponin for ACS in the ED,
 * but misses the diagnosis in an outpatient setting with atypical presentation.
 */
export interface TransferTestTarget {
  transferRuleId: string;
  excludeClinicalSetting?: string;
  excludeAgeGroup?: string;
}

export function buildTransferTestTarget(
  transferRuleId: string,
  currentClinicalSetting?: string,
  currentAgeGroup?: string,
): TransferTestTarget {
  return {
    transferRuleId,
    excludeClinicalSetting: currentClinicalSetting,
    excludeAgeGroup: currentAgeGroup,
  };
}
