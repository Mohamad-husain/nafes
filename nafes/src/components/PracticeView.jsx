import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Flag, Award, Sparkles, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PracticeView({ questions, user, onEndTraining, onToggleFavorite, favoriteIds = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selected: 'a', isCorrect: true } }
  const [userFavorites, setUserFavorites] = useState(new Set(favoriteIds));

  useEffect(() => {
    setUserFavorites(new Set(favoriteIds));
  }, [favoriteIds]);

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl text-center shadow-lg border border-stone-200">
        <h3 className="text-xl font-bold text-stone-800">لم يتم العثور على أسئلة للمؤشرات المختارة</h3>
        <button
          onClick={onEndTraining}
          className="mt-4 px-6 py-2.5 bg-[#0b5d43] text-white rounded-xl font-bold text-sm"
        >
          العودة لاختيار المؤشرات
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id];
  const isAnswered = !!currentAnswer;

  // Stats calculation
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const incorrectCount = Object.values(answers).filter((a) => !a.isCorrect).length;
  const masteryRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Handle Option Click
  const handleSelectOption = (optionKey) => {
    if (isAnswered) return; // Prevent changing answer once selected

    const isCorrect = optionKey.toLowerCase() === currentQ.correct_option.toLowerCase();
    
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selected: optionKey,
        isCorrect
      }
    }));

    if (isCorrect) {
      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }
  };

  // Toggle favorite
  const handleFavoriteClick = () => {
    onToggleFavorite(currentQ.id);
    setUserFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) next.delete(currentQ.id);
      else next.add(currentQ.id);
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finish
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const onFinish = () => {
    onEndTraining({
      totalQuestions,
      answeredCount,
      correctCount,
      incorrectCount,
      unansweredCount: totalQuestions - answeredCount,
      masteryRate,
      answers
    });
  };


  const isFavorite = userFavorites.has(currentQ.id);

  const optionLetters = [
    { key: 'a', label: 'أ', text: currentQ.option_a },
    { key: 'b', label: 'ب', text: currentQ.option_b },
    { key: 'c', label: 'ج', text: currentQ.option_c },
    { key: 'd', label: 'د', text: currentQ.option_d }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Top Header Card & Progress Bar */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-4">
        <div className="flex items-center justify-between text-sm font-bold text-stone-700">
          <span className="flex items-center gap-2 text-[#0b5d43]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0b5d43] animate-pulse"></span>
            تدريب - سؤال {currentIndex + 1} من {totalQuestions}
          </span>
          <span className="text-stone-500">التقدم {progressPercent}%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#0b5d43] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* 5 Stats Display Cards (Matching Screenshot 5) */}
        <div className="grid grid-cols-5 gap-2 pt-2 text-center">
          <div className="bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
            <div className="text-xs text-stone-500 font-medium">الأسئلة</div>
            <div className="text-lg font-black text-stone-800">{totalQuestions}</div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
            <div className="text-xs text-emerald-700 font-medium">صحيحة</div>
            <div className="text-lg font-black text-emerald-700">{correctCount}</div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-200">
            <div className="text-xs text-rose-700 font-medium">خاطئة</div>
            <div className="text-lg font-black text-rose-700">{incorrectCount}</div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
            <div className="text-xs text-amber-800 font-medium">الإتقان</div>
            <div className="text-lg font-black text-amber-800">%{masteryRate}</div>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-200">
            <div className="text-xs text-blue-700 font-medium">المفضلة</div>
            <div className="text-lg font-black text-blue-700">{userFavorites.size}</div>
          </div>
        </div>
      </div>

      {/* Main Question Card (Matching Screenshot 5) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6 relative">
        
        {/* Top Badges & Favorite Star */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-xl border transition-all ${
              isFavorite
                ? 'bg-amber-50 border-amber-300 text-amber-500 shadow-xs'
                : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-amber-500'
            }`}
            title="إضافة السؤال للمفضلة"
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <div className="text-left space-y-1">
            <span className="bg-[#DF9B27]/20 text-[#0b5d43] px-3 py-1 rounded-full text-xs font-black border border-[#DF9B27]/30">
              {currentQ.type || 'اختيار من متعدد'}
            </span>
            <div className="text-[11px] text-stone-400 font-medium max-w-md truncate">
              {currentQ.topic_title} - {currentQ.indicator_title}
            </div>
          </div>
        </div>

        {/* Question Text Prompt */}
        <div className="pt-2">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
            {currentQ.question_text}
          </h3>
        </div>

        {/* Options List (A, B, C, D) */}
        <div className="space-y-3 pt-2">
          {optionLetters.map((opt) => {
            const isSelected = currentAnswer?.selected === opt.key;
            const isCorrectOption = opt.key.toLowerCase() === currentQ.correct_option.toLowerCase();

            let optionStyle = 'bg-stone-50 border-stone-200 hover:bg-stone-100 hover:border-stone-300 text-stone-800';
            let badgeStyle = 'bg-stone-200 text-stone-700';
            let icon = null;

            if (isAnswered) {
              if (isCorrectOption) {
                optionStyle = 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold';
                badgeStyle = 'bg-emerald-600 text-white';
                icon = <Check className="w-5 h-5 text-emerald-600 shrink-0" />;
              } else if (isSelected && !currentAnswer.isCorrect) {
                optionStyle = 'bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold';
                badgeStyle = 'bg-rose-600 text-white';
                icon = <X className="w-5 h-5 text-rose-600 shrink-0" />;
              } else {
                optionStyle = 'bg-stone-50 border-stone-200 opacity-60 text-stone-600';
              }
            }

            return (
              <div
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${badgeStyle}`}>
                    {opt.label}
                  </div>
                  <span className="text-sm sm:text-base font-semibold">{opt.text}</span>
                </div>

                {icon}
              </div>
            );
          })}
        </div>

        {/* Scientific Feedback Box upon Answer */}
        {isAnswered && (
          <div
            className={`p-5 rounded-2xl border text-sm space-y-1 animate-in fade-in duration-200 ${
              currentAnswer.isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="font-extrabold flex items-center gap-2 text-base">
              {currentAnswer.isCorrect ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>أحسنت 🌟</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span>إجابة خاطئة - الإجابة الصحيحة هي ({currentQ['option_' + currentQ.correct_option.toLowerCase()]})</span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm pt-1 leading-relaxed opacity-90">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
          <button
            onClick={onFinish}
            className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all"
          >
            إنهاء التدريب
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentIndex === 0
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#0b5d43] hover:bg-[#074632] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <span>{currentIndex === totalQuestions - 1 ? 'عرض النتائج' : 'التالي'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
