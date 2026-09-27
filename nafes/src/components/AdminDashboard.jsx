import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Award, 
  Search, 
  RefreshCw, 
  Clock, 
  BookOpen, 
  BarChart2, 
  ChevronLeft,
  X,
  FileText
} from 'lucide-react';

export default function AdminDashboard({ token, onLogout, API_URL }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/students-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'فشل في جلب بيانات لوحة التحكم');
      }
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const filteredStudents = data?.students?.filter(s => 
    s.name.includes(searchTerm) || s.national_id.includes(searchTerm)
  ) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 dir-rtl p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <BarChart2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                لوحة متابعة أداء نتائج الطلاب
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-semibold">
                  حساب مشرف
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                استعراض فوري ومتابعة لجميع الطلاب المسجلين وعدد الأسئلة والإجابات الصحيحة والداخلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition duration-200 border border-slate-600 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/40 rounded-2xl border border-slate-700/40">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">جاري تحميل تقارير وأداء الطلاب...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-center">
            <p className="font-bold text-lg mb-2">تعذر جلب البيانات</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Overview Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-800/70 p-6 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">إجمالي الطلاب المسجلين</p>
                  <p className="text-3xl font-black text-white mt-1">{data.overview.total_students}</p>
                </div>
                <div className="p-4 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Users className="w-8 h-8" />
                </div>
              </div>

              <div className="bg-slate-800/70 p-6 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">إجمالي الأسئلة المحلولة بالمنظومة</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">{data.overview.total_system_solved}</p>
                </div>
                <div className="p-4 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <BookOpen className="w-8 h-8" />
                </div>
              </div>

              <div className="bg-slate-800/70 p-6 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">متوسط الإتقان العام</p>
                  <p className="text-3xl font-black text-amber-400 mt-1">{data.overview.system_avg_mastery}%</p>
                </div>
                <div className="p-4 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">
              {/* Search Bar & Table Header */}
              <div className="p-6 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">قائمة نتائج الطلاب بالتفصيل</h2>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                    {filteredStudents.length} طالب
                  </span>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="بحث باسم الطالب أو رقم الهوية..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700/60">
                      <th className="py-4 px-6">اسم الطالب</th>
                      <th className="py-4 px-6">رقم الهوية</th>
                      <th className="py-4 px-6 text-center">الأسئلة المحلولة</th>
                      <th className="py-4 px-6 text-center">الإجابات الصحيحة</th>
                      <th className="py-4 px-6 text-center">الإجابات الخاطئة</th>
                      <th className="py-4 px-6 text-center">نسبة الإتقان</th>
                      <th className="py-4 px-6 text-center">عدد المحاولات</th>
                      <th className="py-4 px-6 text-left">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40 text-sm text-slate-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-400 font-medium">
                          لا يوجد طلاب يطابقون كلمة البحث
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.student_id} className="hover:bg-slate-700/30 transition duration-150">
                          <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/30">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <span>{student.name}</span>
                              <div className="text-xs text-slate-400 font-normal">
                                سجل في {new Date(student.registered_at).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 font-mono text-slate-300 font-medium">
                            {student.national_id}
                          </td>

                          <td className="py-4 px-6 text-center font-bold text-slate-100">
                            {student.total_solved} سؤال
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-bold text-xs border border-emerald-500/30">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {student.total_correct}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/15 text-rose-400 rounded-full font-bold text-xs border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              {student.total_incorrect}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-black text-xs ${
                                student.avg_mastery >= 80 ? 'text-emerald-400' :
                                student.avg_mastery >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {student.avg_mastery}%
                              </span>
                              <div className="w-20 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    student.avg_mastery >= 80 ? 'bg-emerald-500' :
                                    student.avg_mastery >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${student.avg_mastery}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center font-semibold text-slate-300">
                            {student.attempts_count} محاولات
                          </td>

                          <td className="py-4 px-6 text-left">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold transition"
                            >
                              عرض السجل
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Student Attempt History Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 relative max-h-[85vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    سجل محاولات الطالب: {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    رقم الهوية: {selectedStudent.national_id} | إجمالي المحاولات: {selectedStudent.attempts_count}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-700/50 hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {selectedStudent.attempts.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 font-medium">
                    لم يقم الطالب بعد بإجراء أي اختبارات أو جلسات تدريبية.
                  </p>
                ) : (
                  selectedStudent.attempts.map((att, idx) => (
                    <div 
                      key={att.id || idx}
                      className="p-4 bg-slate-900/70 border border-slate-700/60 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(att.completed_at).toLocaleString('ar-SA')}
                        </div>
                        <p className="text-sm font-bold text-white">
                          حل {att.total_questions} سؤال في التقييم
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                          {att.correct_count} صحيحة
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-bold">
                          {att.incorrect_count} خاطئة
                        </span>
                        <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                          {att.mastery_rate}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
