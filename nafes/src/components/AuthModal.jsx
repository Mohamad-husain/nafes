import React, { useState } from 'react';
import { User, Lock, IdCard, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // National ID format validation (10 digits)
    if (!/^\d{10}$/.test(nationalId)) {
      setError('رقم الهوية يجب أن يتكون من 10 أرقام (مثال: 1000000000)');
      return;
    }

    if (isRegister && !name.trim()) {
      setError('يرجى إدخال اسم الطالب ثلاثي');
      return;
    }

    if (!password || password.length < 4) {
      setError('كلمة المرور يجب أن تتكون من 4 خانات على الأقل');
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { national_id: nationalId, name, password } : { national_id: nationalId, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }

      // Save token and user details to localStorage
      localStorage.setItem('nafes_token', data.token);
      localStorage.setItem('nafes_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ national_id: '1000000000', password: '123456' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('nafes_token', data.token);
      localStorage.setItem('nafes_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0b5d43] text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#DF9B27] text-[#0b5d43] rounded-2xl font-black text-2xl mb-3 shadow-md">
            ن
          </div>
          <h2 className="text-xl font-black">
            {isRegister ? 'إنشاء حساب طالب جديد' : 'تسجيل دخول الطلاب'}
          </h2>
          <p className="text-xs text-stone-200 mt-1">
            منصة التدريب الذاتي لاختبارات نافس - مادة العلوم للصف السادس
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {/* Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                !isRegister ? 'bg-[#0b5d43] text-white shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                isRegister ? 'bg-[#0b5d43] text-white shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حساب جديد
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* National ID Field */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                رقم الهوية الوطنية / رقم الإقامة (10 أرقام)
              </label>
              <div className="relative">
                <IdCard className="w-5 h-5 text-stone-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  maxLength={10}
                  placeholder="مثال: 1000000000"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-stone-300 focus:border-[#0b5d43] focus:ring-2 focus:ring-[#0b5d43]/20 outline-none text-sm transition-all dir-ltr text-right font-mono"
                  required
                />
              </div>
            </div>

            {/* Name Field if Registering */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم الطالب ثلاثي
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-stone-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="مثال: محمد عبدالله الغامدي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-stone-300 focus:border-[#0b5d43] focus:ring-2 focus:ring-[#0b5d43]/20 outline-none text-sm transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute right-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-stone-300 focus:border-[#0b5d43] focus:ring-2 focus:ring-[#0b5d43]/20 outline-none text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0b5d43] hover:bg-[#074632] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isRegister ? (
                'تسجيل وإعداد الحساب'
              ) : (
                'الدخول للتدريب'
              )}
            </button>
          </form>

          {/* Quick Demo Login Shortcut */}
          <div className="pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 bg-[#DF9B27]/15 hover:bg-[#DF9B27]/25 text-[#0b5d43] font-bold rounded-xl border border-[#DF9B27]/40 transition-all text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#DF9B27]" />
              <span>دخول سريع تجريبي (طالب افتراضي)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
