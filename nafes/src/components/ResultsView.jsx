import React, { useEffect } from 'react';
import { Trophy, CheckCircle, XCircle, RotateCcw, Home, Sparkles, Star, Award, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultsView({ results, questions, user, onRestart, onGoHome }) {
  const { totalQuestions, correctCount, incorrectCount, masteryRate, answers } = results;
  const answeredCount = results.answeredCount !== undefined ? results.answeredCount : Object.keys(answers || {}).length;
  const unansweredCount = totalQuestions - answeredCount;

  useEffect(() => {
    // Launch celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    // Save attempt to server if user is logged in
    const token = localStorage.getItem('nafes_token');
    if (token) {
      // Find indicator IDs for questions actually answered
      const answeredQIds = Object.keys(answers || {}).map((id) => String(id));
      const solvedIndIds = questions
        .filter((q) => answeredQIds.includes(String(q.id)) || answeredQIds.includes(String(q._id)))
        .map((q) => q.indicator_id);

      const API_BASE = import.meta.env.VITE_API_URL || '';
      fetch(`${API_BASE}/api/attempts/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({

          total_questions: totalQuestions,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          mastery_rate: masteryRate,
          indicator_ids: solvedIndIds
        })
      }).catch(err => console.error('Failed to save attempt:', err));
    }
  }, [results, totalQuestions, correctCount, incorrectCount, masteryRate, answers, questions]);

  // Determine badge performance
  let gradeBadge = { label: 'ممتاز! متقن ببراعة 🏆', color: 'bg-emerald-500 text-white' };
  if (masteryRate < 50) {
    gradeBadge = { label: 'تحتاج المزيد من التدريب 💡', color: 'bg-amber-500 text-white' };
  } else if (masteryRate < 80) {
    gradeBadge = { label: 'جيد جداً! استمر بالتقدم 👍', color: 'bg-blue-500 text-white' };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Trophy Card & Overall Score */}
      <div className="bg-gradient-to-br from-[#0b5d43] to-[#074632] text-white rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#DF9B27]/20 rounded-full blur-2xl"></div>

        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#DF9B27] text-[#0b5d43] rounded-3xl mb-4 shadow-xl">
          <Trophy className="w-10 h-10 fill-current" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black">نتيجة التدريب في مادة العلوم</h2>
        <p className="text-stone-200 text-sm mt-1">الصف السادس الابتدائي - اختبارات نافس</p>

        {/* Score Circle & Stats */}
        <div className="mt-6 inline-block bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20">
          <div className="text-4xl sm:text-5xl font-black text-[#DF9B27]">
            %{masteryRate}
          </div>
          <div className="text-xs text-stone-200 font-bold mt-1">نسبة الإتقان العامة</div>
        </div>

        <div className="mt-4">
          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black shadow ${gradeBadge.color}`}>
            {gradeBadge.label}
          </span>
        </div>

        {/* 4 Quick Numbers Grid (Showing Solved out of Total Selected) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mt-8 pt-6 border-t border-emerald-600/40 text-center">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
            <div className="text-xs text-stone-200 font-medium">الأسئلة المحلولة</div>
            <div className="text-lg font-extrabold text-[#DF9B27] mt-0.5">
              {answeredCount} <span className="text-xs text-stone-300 font-normal">من أصل {totalQuestions}</span>
            </div>
          </div>

          <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-400/30">
            <div className="text-xs text-emerald-200 font-medium">إجابات صحيحة</div>
            <div className="text-lg font-extrabold text-emerald-300 mt-0.5">{correctCount}</div>
          </div>

          <div className="bg-rose-500/20 p-3 rounded-2xl border border-rose-400/30">
            <div className="text-xs text-rose-200 font-medium">إجابات خاطئة</div>
            <div className="text-lg font-extrabold text-rose-300 mt-0.5">{incorrectCount}</div>
          </div>

          <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-400/30">
            <div className="text-xs text-amber-200 font-medium">أسئلة لم تُحل</div>
            <div className="text-lg font-extrabold text-amber-300 mt-0.5">{unansweredCount}</div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRestart}
          className="w-full sm:w-auto px-6 py-3 bg-[#0b5d43] hover:bg-[#074632] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة التدريب بنفس الأسئلة</span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>اختيار مؤشرات أخرى</span>
        </button>
      </div>

      {/* Detailed Question Review List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-r-4 border-[#0b5d43] pr-3">
          <h3 className="text-xl font-black text-stone-800">
            مراجعة تفصيلية للأسئلة والإجابات
          </h3>
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            تم حل {answeredCount} من أصل {totalQuestions} سؤالاً
          </span>
        </div>

        <div className="space-y-4 divide-y divide-stone-100">
          {questions.map((q, idx) => {
            const userAns = answers[q.id] || answers[q._id];
            const isCorrect = userAns?.isCorrect;

            return (
              <div key={q.id || q._id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm sm:text-base">{q.question_text}</h4>
                  </div>

                  {userAns ? (
                    isCorrect ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> صحيحة
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                        <XCircle className="w-3.5 h-3.5" /> خاطئة
                      </span>
                    )
                  ) : (
                    <span className="bg-stone-100 text-stone-500 border border-stone-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-stone-400" /> غير مجاب
                    </span>
                  )}
                </div>

                <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1 border border-stone-200">
                  <div className="text-stone-700 font-semibold">
                    إجابتك: <span className={userAns ? (isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold') : 'text-stone-400 italic'}>
                      {userAns ? q['option_' + userAns.selected.toLowerCase()] : 'لم يقم الطالب بحل هذا السؤال'}
                    </span>
                  </div>

                  {(!userAns || !isCorrect) && (
                    <div className="text-emerald-800 font-bold">
                      الإجابة الصحيحة: {q['option_' + q.correct_option.toLowerCase()]}
                    </div>
                  )}

                  <div className="text-stone-500 pt-1 text-[11px] leading-relaxed border-t border-stone-200/60 mt-1">
                    💡 <span className="font-semibold text-stone-700">التوضيح:</span> {q.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
