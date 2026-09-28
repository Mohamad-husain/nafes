import { remainingQuestions } from './progress';
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ScienceCardView from './components/ScienceCardView';
import IndicatorSelector from './components/IndicatorSelector';
import PracticeView from './components/PracticeView';
import ResultsView from './components/ResultsView';
import AdminDashboard from './components/AdminDashboard';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [view, setView] = useState('card'); // 'card' | 'indicators' | 'practice' | 'results'
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Active test state
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [activeResults, setActiveResults] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Progress is loaded from the authenticated account, never shared local storage.
  const [solvedQuestionIds, setSolvedQuestionIds] = useState([]);
  const [activeIndicatorIds, setActiveIndicatorIds] = useState([]);
  const [progressError, setProgressError] = useState('');

  // Check saved user session and fetch Science topics structure
  useEffect(() => {
    const savedUser = localStorage.getItem('nafes_user');
    const token = localStorage.getItem('nafes_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        fetchFavorites(token);
        fetchSolvedData(token);
      } catch (e) {}
    }

    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/science/structure`);
      const data = await res.json();
      setStructure(data);
    } catch (err) {
      console.error('Error fetching structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.favoriteIds) {
        setFavoriteIds(data.favoriteIds);
      }
    } catch (e) {}
  };

  const fetchSolvedData = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/indicators/solved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('تعذر تحميل التقدم المحفوظ. حاول مرة أخرى.');
      const data = await res.json();
      const ids = [...new Set((data.solvedQuestionIds || []).map(String))];
      if (localStorage.getItem('nafes_token') === token) {
        setSolvedQuestionIds(ids);
        setProgressError('');
      }
      return ids;
    } catch (error) {
      if (localStorage.getItem('nafes_token') === token) setProgressError(error.message);
      return null;
    }
  };

  const markSolved = async (questionId) => {
    const token = localStorage.getItem('nafes_token');
    const res = await fetch(`${API_BASE}/api/indicators/solved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question_ids: [questionId] }),
      keepalive: true
    });
    if (!res.ok) throw new Error('تعذر حفظ الإجابة. أعد المحاولة قبل المتابعة.');
    if (localStorage.getItem('nafes_token') === token) {
      setSolvedQuestionIds(prev => [...new Set([...prev, String(questionId)])]);
    }
  };

  const handleLoginSuccess = (userObj) => {
    setSolvedQuestionIds([]);
    setUser(userObj);
    const token = localStorage.getItem('nafes_token');
    if (token) {
      fetchFavorites(token);
      fetchSolvedData(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nafes_token');
    localStorage.removeItem('nafes_user');
    setUser(null);
    setSolvedQuestionIds([]);
    setActiveQuestions([]);
    setActiveResults(null);
    setView('card');
    setProgressError('');
    setFavoriteIds([]);
  };

  // Start training with selected indicator IDs (Resuming progress on unsolved questions)
  const handleStartTraining = async (selectedIndicatorIds) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('nafes_token');
      const answeredIds = await fetchSolvedData(token);
      if (answeredIds === null || localStorage.getItem('nafes_token') !== token) return;
      const res = await fetch(`${API_BASE}/api/science/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator_ids: selectedIndicatorIds })
      });
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      if (localStorage.getItem('nafes_token') !== token) return;

      if (data.questions && data.questions.length > 0) {
        const allFetched = data.questions;
        // Filter out questions already solved to resume progress
        const unsolved = remainingQuestions(allFetched, answeredIds);
        if (unsolved.length === 0) {
          setView('indicators');
          return;
        }
        setActiveIndicatorIds(selectedIndicatorIds);
        const targetQuestions = unsolved;

        setActiveQuestions(targetQuestions);
        setView('practice');
      } else {
        alert('لم يتم إيجاد أسئلة للمؤشرات المحددة');
      }
    } catch (err) {
      alert('حدث خطأ في تحميل الأسئلة');
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite API
  const handleToggleFavorite = async (questionId) => {
    const token = localStorage.getItem('nafes_token');
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question_id: questionId })
      });
      const data = await res.json();

      if (data.isFavorite) {
        setFavoriteIds((prev) => [...prev, questionId]);
      } else {
        setFavoriteIds((prev) => prev.filter((id) => id !== questionId));
      }
    } catch (e) {}
  };

  const handleEndTraining = (results) => {
    if (results) {
      setActiveResults(results);

      setView('results');
    } else {
      setView('indicators');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5ee] flex flex-col text-stone-800 font-sans">
      
      {/* Header Navigation */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onGoHome={() => setView('card')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {progressError && <p role="alert" className="mb-4 text-red-700">{progressError}</p>}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#0b5d43] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-stone-600">جاري تحميل مادة العلوم لاختبارات نافس...</p>
          </div>
        ) : user?.role === 'admin' ? (
          <AdminDashboard
            token={localStorage.getItem('nafes_token')}
            onLogout={handleLogout}
            API_URL={API_BASE}
          />
        ) : (
          <>
            {view === 'card' && (
              <ScienceCardView
                totals={structure?.totals}
                user={user}
                onSelectScience={() => setView('indicators')}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {view === 'indicators' && (
              <IndicatorSelector
                structure={structure}
                solvedQuestionIds={solvedQuestionIds}
                onStartTraining={handleStartTraining}
                onGoBack={() => setView('card')}
              />
            )}

            {view === 'practice' && (
              <PracticeView
                questions={activeQuestions}
                user={user}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onEndTraining={handleEndTraining}
                onAnswer={markSolved}
              />
            )}

            {view === 'results' && activeResults && (
              <ResultsView
                results={activeResults}
                questions={activeQuestions}
                user={user}
                onRestart={() => handleStartTraining(activeIndicatorIds)}
                canContinue={activeQuestions.some(q => !solvedQuestionIds.includes(String(q.id)))}
                onGoHome={() => setView('indicators')}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0b5d43] text-stone-200 text-xs py-6 border-t border-[#074632] mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-semibold">
            جميع الحقوق محفوظة © منصة التدريب على اختبارات نافس - مادة العلوم للصف السادس الابتدائي 2026
          </p>
          <p className="text-stone-300 text-[11px]">
            تم التطوير والإعداد وفق المعايير والنواتج التعليمية لهيئة تقويم التعليم والتدريب
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
