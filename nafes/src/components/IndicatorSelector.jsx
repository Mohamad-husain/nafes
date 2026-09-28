import { weekProgress } from '../progress';
import React, { useState, useMemo } from 'react';
import { Search, CheckSquare, Square, ChevronDown, ChevronLeft, Play, RefreshCw, Filter, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export default function IndicatorSelector({ structure, solvedQuestionIds = [], onStartTraining, onGoBack }) {
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Expand topic 1 by default
  React.useEffect(() => {
    if (structure?.topics && structure.topics.length > 0) {
      setExpandedTopics({ [structure.topics[0].id]: true });
    }
  }, [structure]);

  // Toggle topic expansion
  const toggleExpand = (topicId) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Filter topics and indicators by search query
  const filteredTopics = useMemo(() => {
    if (!structure?.topics) return [];
    if (!searchQuery.trim()) return structure.topics;

    const q = searchQuery.toLowerCase().trim();
    return structure.topics
      .map((topic) => {
        const matchingIndicators = topic.indicators.filter(
          (ind) => ind.title.toLowerCase().includes(q) || topic.title.toLowerCase().includes(q)
        );
        if (topic.title.toLowerCase().includes(q) || matchingIndicators.length > 0) {
          return { ...topic, indicators: matchingIndicators };
        }
        return null;
      })
      .filter(Boolean);
  }, [structure, searchQuery]);

  // Toggle single indicator
  const toggleIndicator = (indId) => {
    setSelectedIndicators((prev) =>
      prev.includes(indId) ? prev.filter((id) => id !== indId) : [...prev, indId]
    );
  };

  // Toggle all indicators in a topic
  const toggleTopicAll = (topic) => {
    const topicIndIds = topic.indicators.map((ind) => ind.id);
    const allSelected = topicIndIds.every((id) => selectedIndicators.includes(id));

    if (allSelected) {
      setSelectedIndicators((prev) => prev.filter((id) => !topicIndIds.includes(id)));
    } else {
      setSelectedIndicators((prev) => Array.from(new Set([...prev, ...topicIndIds])));
    }
  };

  // Select all everywhere
  const selectAll = () => {
    const allIds = [];
    structure?.topics?.forEach((t) => {
      t.indicators.forEach((i) => allIds.push(i.id));
    });
    setSelectedIndicators(allIds);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIndicators([]);
  };

  // Count total questions in current selection
  const selectedQuestionsCount = useMemo(() => {
    let count = 0;
    structure?.topics?.forEach((t) => {
      t.indicators.forEach((i) => {
        if (selectedIndicators.includes(i.id)) {
          count += (i.question_ids || []).filter(id => !solvedQuestionIds.includes(String(id))).length;
        }
      });
    });
    return count;
  }, [structure, selectedIndicators, solvedQuestionIds]);

  const handleStart = () => {
    if (selectedIndicators.length === 0) {
      alert('يرجى اختيار مؤشر واحد على الأقل للبدء في التدريب');
      return;
    }
    onStartTraining(selectedIndicators);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Subject Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b5d43] flex items-center gap-2">
            <span>العلوم</span>
            <span className="text-xl">🔬</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            اختر نواتج التعلم أو المؤشرات التي تريد التدرب عليها، ثم اضغط «ابدأ التدريب».
          </p>
        </div>

        <button
          onClick={onGoBack}
          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
        >
          العودة للمواد
        </button>
      </div>

      {/* Sticky Action Toolbar & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-md sticky top-20 z-30 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleStart}
              disabled={selectedQuestionsCount === 0}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                selectedQuestionsCount > 0
                  ? 'bg-[#0b5d43] hover:bg-[#074632] text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ابدأ التدريب ({selectedQuestionsCount})</span>
            </button>

            <button
              onClick={clearSelection}
              className="px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <span>✕ مسح التحديد</span>
            </button>

            <button
              onClick={selectAll}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0b5d43] font-bold text-xs flex items-center gap-1 transition-all"
            >
              <span>✓ اختيار الكل</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="ابحث في النواتج والمؤشرات ونصوص الأسئلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-stone-50 rounded-xl border border-stone-300 focus:border-[#0b5d43] outline-none text-xs text-stone-800"
            />
          </div>

        </div>
      </div>

      {/* Accordion Topics List */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => {
          const isExpanded = !!expandedTopics[topic.id];
          const topicIndIds = topic.indicators.map((i) => i.id);
          const selectedCountInTopic = topicIndIds.filter((id) => selectedIndicators.includes(id)).length;

          // Use the full week even when search hides some indicators.
          const fullTopic = structure.topics.find(t => t.id === topic.id);
          const { answeredCount: topicSolvedQs, totalCount: topicTotalQs, isComplete } = weekProgress(fullTopic, solvedQuestionIds);

          const isAllTopicSelected = topicIndIds.length > 0 && selectedCountInTopic === topicIndIds.length;

          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition-all"
            >
              {/* Topic Header Bar */}
              <div className="p-4 bg-stone-50/80 border-b border-stone-200/60 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleExpand(topic.id)}>
                  <button className="text-stone-500 p-1 hover:text-[#0b5d43]">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>

                  <h3 className="font-extrabold text-stone-800 text-sm sm:text-base">
                    {topic.title}
                  </h3>

                  <span className="bg-emerald-800/10 text-[#0b5d43] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-800/20">
                    {topicTotalQs} سؤال
                  </span>

                  {(
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تم حل {topicSolvedQs} من أصل {topicTotalQs} سؤالاً{isComplete ? ' · مكتمل' : ''}</span>
                    </span>
                  )}
                </div>

                {topicSolvedQs > 0 && !isComplete && (
                  <button onClick={() => onStartTraining(fullTopic.indicators.map(ind => ind.id))}
                    className="text-xs font-bold text-[#0b5d43] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    إكمال الحل
                  </button>
                )}
                {/* Topic Select All Checkbox */}
                <button
                  onClick={() => toggleTopicAll(topic)}
                  className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#0b5d43] bg-white px-3 py-1.5 rounded-xl border border-stone-300 shadow-xs"
                >
                  {isAllTopicSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#0b5d43]" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                  <span className="hidden sm:inline">تحديد الكل</span>
                </button>
              </div>

              {/* Expanded Sub-indicators List */}
              {isExpanded && (
                <div className="p-4 space-y-2 bg-white divide-y divide-stone-100">
                  {topic.indicators.map((ind) => {
                    const isSelected = selectedIndicators.includes(ind.id);
                    const indQIds = (ind.question_ids || []).map(String);
                    const totalInInd = indQIds.length || ind.question_count || 0;
                    const solvedInInd = indQIds.filter((id) => solvedQuestionIds.includes(String(id))).length;
                    const isFullySolved = totalInInd > 0 && solvedInInd === totalInInd;
                    const isPartiallySolved = !isFullySolved && solvedInInd > 0;

                    return (
                      <div
                        key={ind.id}
                        onClick={() => toggleIndicator(ind.id)}
                        className={`pt-3 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/80 border border-emerald-300 shadow-xs'
                            : isFullySolved
                            ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                            : isPartiallySolved
                            ? 'bg-amber-50/30 hover:bg-amber-50/50'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#0b5d43] shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-stone-300 shrink-0" />
                          )}
                          <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-[#0b5d43] font-bold' : 'text-stone-700'}`}>
                            {ind.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isFullySolved && (
                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                              <span>تم حلها ✓ ({solvedInInd}/{totalInInd})</span>
                            </span>
                          )}
                          {isPartiallySolved && (
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>{solvedInInd}/{totalInInd} تم حلها</span>
                            </span>
                          )}
                          <span className="text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md font-medium">
                            {totalInInd} سؤال
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
