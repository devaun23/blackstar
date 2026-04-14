/**
 * Contrast strategy: student fell for a confusion set member.
 *
 * Selection: Same target_confusion_set_id, different correct answer.
 * This forces direct comparison between the confused conditions.
 *
 * Example: If the student confused pericarditis with STEMI,
 * show a case where pericarditis IS the correct answer next,
 * highlighting the distinguishing features.
 */
export interface ContrastTarget {
  confusionSetId: string;
  excludeCorrectAnswer: string; // Show case with a different member as correct
  excludeQuestionId: string;
}

export function buildContrastTarget(
  confusionSetId: string,
  lastCorrectAnswer: string,
  lastQuestionId: string,
): ContrastTarget {
  return {
    confusionSetId,
    excludeCorrectAnswer: lastCorrectAnswer,
    excludeQuestionId: lastQuestionId,
  };
}
