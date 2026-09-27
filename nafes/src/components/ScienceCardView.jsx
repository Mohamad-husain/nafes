import React from 'react';
import { Microscope, Sparkles, ArrowLeft, Flame } from 'lucide-react';

export default function ScienceCardView({ totals, user, onSelectScience, onOpenAuth }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
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
          <h3 className="text-xl font-black text-stone-800">المادة المتاحة للتدريب</h3>
          <p className="text-xs text-stone-500">تم تجهيز كافة معايير ومؤشرات مادة العلوم للصف السادس الابتدائي</p>
        </div>
      </div>

      {/* Science Card (Centrally Displayed) */}
      <div className="max-w-xl mx-auto">
        <div 
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              onSelectScience();
            }
          }}
          className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#0b5d43] shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group transform hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 bg-[#DF9B27] text-[#0b5d43] px-3.5 py-1 text-[11px] font-black rounded-br-2xl flex items-center gap-1 shadow">
            <Flame className="w-3.5 h-3.5 fill-[#0b5d43]" />
            <span>المادة المتاحة</span>
          </div>

          <div>
            <div className="w-16 h-16 bg-[#0b5d43] text-white rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
              <Microscope className="w-9 h-9" />
            </div>

            <h4 className="text-2xl sm:text-3xl font-black text-[#0b5d43] group-hover:text-[#074632] transition-colors">
              العلوم
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium leading-relaxed">
              علوم الحياة، العلوم الفيزيائية، علوم الأرض والفضاء، الخلية، الأجهزة الحيوية والأنظمة البيئية.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-100">
            {/* Badges */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold gap-2 mb-5">
              <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
                {totals?.topics || 5} نواتج
              </span>
              <span className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200">
                {totals?.indicators || 17} مؤشراً
              </span>
              <span className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200">
                {totals?.questions || 45} سؤال
              </span>
            </div>

            <button className="w-full py-3.5 bg-[#0b5d43] group-hover:bg-[#074632] text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all">
              <span>بدء تدريبات العلوم</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
