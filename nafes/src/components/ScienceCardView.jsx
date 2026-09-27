import React from 'react';
import { Microscope, BookOpen, Calculator, Sparkles, CheckCircle, ArrowLeft, Award, Flame } from 'lucide-react';

export default function ScienceCardView({ totals, user, onSelectScience, onOpenAuth }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0b5d43] to-[#074632] text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden text-center border border-emerald-700/40">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#DF9B27]/10 rounded-full blur-2xl"></div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#DF9B27]/20 text-[#DF9B27] px-4 py-1.5 rounded-full text-xs font-bold border border-[#DF9B27]/30">
            <Sparkles className="w-4 h-4" />
            <span>منصة التدريب والتهيئة الذاتية</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            استعد لاختبارات نافس بثقة وتميّز
          </h2>

          <p className="text-stone-200 text-sm sm:text-base max-w-2xl mx-auto">
            منصة مخصصة لتدريب طلاب <span className="text-[#DF9B27] font-bold">الصف السادس الابتدائي</span> على أسئلة ومؤشرات مادة العلوم المعززة لمعايير هيئة تقويم التعليم والتدريب.
          </p>

          {!user && (
            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="px-6 py-2.5 bg-[#DF9B27] hover:bg-[#c9891e] text-[#0b5d43] font-black rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm inline-flex items-center gap-2"
              >
                <span>سجّل دخولك الآن لحفظ إنجازاتك ومفضلتك</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subject Selection Section Header */}
      <div className="flex items-center justify-between border-r-4 border-[#DF9B27] pr-3">
        <div>
          <h3 className="text-xl font-black text-stone-800">اختر المادة للتدريب</h3>
          <p className="text-xs text-stone-500">تم اختيار مادة العلوم للصف السادس وتوفير كافة مؤشراتها المعرفية</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lughati Card (Disabled / Preview) */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm opacity-60 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-stone-800">لغتي</h4>
            <p className="text-xs text-stone-500 mt-1">القراءة، الفهم القرائي، والمفردات اللغوية</p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>قريباً في نافس بلس</span>
            <span className="bg-stone-100 px-2.5 py-1 rounded-md text-[10px]">مغلق حالياً</span>
          </div>
        </div>

        {/* Science Card (Active & Featured) */}
        <div 
          onClick={onSelectScience}
          className="bg-white rounded-3xl p-6 border-2 border-[#0b5d43] shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group transform hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 bg-[#DF9B27] text-[#0b5d43] px-3 py-1 text-[11px] font-black rounded-br-2xl flex items-center gap-1 shadow">
            <Flame className="w-3.5 h-3.5 fill-[#0b5d43]" />
            <span>المادة المتاحة</span>
          </div>

          <div>
            <div className="w-14 h-14 bg-[#0b5d43] text-white rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
              <Microscope className="w-8 h-8" />
            </div>

            <h4 className="text-2xl font-black text-[#0b5d43] group-hover:text-[#074632] transition-colors">
              العلوم
            </h4>
            <p className="text-xs text-stone-600 mt-2 font-medium leading-relaxed">
              علوم الحياة، العلوم الفيزيائية، علوم الأرض والفضاء، الخلية، الأجهزة الحيوية والأنظمة البيئية.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-100">
            {/* Badges */}
            <div className="flex items-center justify-between text-xs font-bold gap-1 mb-4">
              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                {totals?.topics || 13} نواتج
              </span>
              <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                {totals?.indicators || 82} مؤشراً
              </span>
              <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                {totals?.questions || 206} سؤال
              </span>
            </div>

            <button className="w-full py-3 bg-[#0b5d43] group-hover:bg-[#074632] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all">
              <span>بدء تدريبات العلوم</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Mathematics Card (Disabled / Preview) */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm opacity-60 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-4">
              <Calculator className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-stone-800">الرياضيات</h4>
            <p className="text-xs text-stone-500 mt-1">الأعداد، الكسور، الجبر، الهندسة والقياس</p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>قريباً في نافس بلس</span>
            <span className="bg-stone-100 px-2.5 py-1 rounded-md text-[10px]">مغلق حالياً</span>
          </div>
        </div>

      </div>

    </div>
  );
}
