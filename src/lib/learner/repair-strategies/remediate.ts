/**
 * Remediate strategy: repeated cognitive error (3x+).
 *
 * Selection: Same target_cognitive_error_id, lower difficulty.
 * The goal is to isolate the reasoning failure and rebuild from a simpler case.
 *
 * Example: If the student keeps exhibiting "premature closure," serve a case
 * where the distinguishing feature is more obvious, making the error pattern
 * explicit before returning to harder cases.
 */
export interface RemediateTarget {
  cognitiveErrorId: string;
  maxDifficulty: number; // Lower than current difficulty
}

export function buildRemediateTarget(
  cognitiveErrorId: string,
  currentDifficulty: number,
): RemediateTarget {
  return {
    cognitiveErrorId,
    maxDifficulty: Math.max(1, currentDifficulty - 1),
  };
}
