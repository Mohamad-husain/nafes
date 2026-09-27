import React from 'react';
import { BookOpen, LogOut, User, Home, Award, Sparkles } from 'lucide-react';

export default function Header({ user, onLogout, onOpenAuth, onGoHome }) {
  return (
    <header className="bg-[#0b5d43] text-white shadow-md border-b border-[#074632] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Right Logo & Title */}
        <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={onGoHome}>
          <div className="bg-[#DF9B27] text-[#0b5d43] w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner">
            ن
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
              التدريب على اختبارات نافس
              <span className="bg-[#DF9B27]/20 text-[#DF9B27] text-xs px-2 py-0.5 rounded-full font-medium">
                الصف السادس الابتدائي
              </span>
            </h1>
            <p className="text-xs text-stone-200">وفق معايير هيئة تقويم التعليم والتدريب - مادة العلوم</p>
          </div>
        </div>

        {/* Action Controls & User status */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-[#074632] px-3 py-1.5 rounded-lg text-xs text-stone-100 border border-emerald-600/40">
                <User className="w-4 h-4 text-[#DF9B27]" />
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    {user.name}
                    {user.role === 'admin' && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        مشرف 👑
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-emerald-200">الهوية: {user.national_id}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-all shadow"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DF9B27] hover:bg-[#c9891e] text-[#0b5d43] text-sm font-bold shadow-lg transition-all"
            >
              <User className="w-4 h-4" />
              <span>تسجيل الدخول / حساب جديد</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
