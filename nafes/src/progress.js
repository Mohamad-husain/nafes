export function remainingQuestions(allQuestions, answeredQuestionIds) {
  const answered = new Set(answeredQuestionIds.map(String));
  return allQuestions.filter(q => !answered.has(String(q.id ?? q._id)));
}

export function weekProgress(topic, answeredIds) {
  const questionIds = [...new Set(topic.indicators.flatMap(ind => (ind.question_ids || []).map(String)))];
  const answered = new Set(answeredIds.map(String));
  const answeredQuestionIds = questionIds.filter(id => answered.has(id));
  return {
    answeredQuestionIds,
    answeredCount: answeredQuestionIds.length,
    totalCount: questionIds.length,
    isComplete: questionIds.length > 0 && answeredQuestionIds.length === questionIds.length,
  };
}
