import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ScienceCardView from './components/ScienceCardView';
import IndicatorSelector from './components/IndicatorSelector';
import PracticeView from './components/PracticeView';
import ResultsView from './components/ResultsView';

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

  // Solved indicators tracking state
  const [solvedIndicatorIds, setSolvedIndicatorIds] = useState(() => {
    try {
      const saved = localStorage.getItem('nafes_solved_indicators');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Check saved user session and fetch Science topics structure
  useEffect(() => {
    const savedUser = localStorage.getItem('nafes_user');
    const token = localStorage.getItem('nafes_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        fetchFavorites(token);
        fetchSolvedIndicators(token);
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

  const fetchSolvedIndicators = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/indicators/solved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.solvedIndicatorIds) {
        setSolvedIndicatorIds((prev) => {
          const merged = Array.from(new Set([...prev, ...data.solvedIndicatorIds]));
          localStorage.setItem('nafes_solved_indicators', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {}
  };

  const markIndicatorsAsSolved = (indicatorIds) => {
    if (!indicatorIds || indicatorIds.length === 0) return;
    setSolvedIndicatorIds((prev) => {
      const updated = Array.from(new Set([...prev, ...indicatorIds]));
      localStorage.setItem('nafes_solved_indicators', JSON.stringify(updated));
      return updated;
    });

    const token = localStorage.getItem('nafes_token');
    if (token) {
      fetch(`${API_BASE}/api/indicators/solved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ indicator_ids: indicatorIds })
      }).catch(() => {});
    }
  };

  const handleResetSolved = () => {
    setSolvedIndicatorIds([]);
    localStorage.removeItem('nafes_solved_indicators');
    const token = localStorage.getItem('nafes_token');
    if (token) {
      fetch(`${API_BASE}/api/indicators/solved`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  };

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    const token = localStorage.getItem('nafes_token');
    if (token) {
      fetchFavorites(token);
      fetchSolvedIndicators(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nafes_token');
    localStorage.removeItem('nafes_user');
    setUser(null);
    setFavoriteIds([]);
  };

  // Start training with selected indicator IDs
  const handleStartTraining = async (selectedIndicatorIds) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/science/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator_ids: selectedIndicatorIds })
      });
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setActiveQuestions(data.questions);
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
      // ONLY mark indicators as solved for questions ACTUALLY answered by student!
      const answeredQIds = Object.keys(results.answers || {}).map((id) => String(id));
      const actuallyAnsweredIndicatorIds = activeQuestions
        .filter((q) => answeredQIds.includes(String(q.id)) || answeredQIds.includes(String(q._id)))
        .map((q) => q.indicator_id);

      if (actuallyAnsweredIndicatorIds.length > 0) {
        markIndicatorsAsSolved(actuallyAnsweredIndicatorIds);
      }

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
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#0b5d43] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-stone-600">جاري تحميل مادة العلوم لاختبارات نافس...</p>
          </div>
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
                solvedIndicatorIds={solvedIndicatorIds}
                onStartTraining={handleStartTraining}
                onGoBack={() => setView('card')}
                onResetSolved={handleResetSolved}
              />
            )}

            {view === 'practice' && (
              <PracticeView
                questions={activeQuestions}
                user={user}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onEndTraining={handleEndTraining}
              />
            )}

            {view === 'results' && activeResults && (
              <ResultsView
                results={activeResults}
                questions={activeQuestions}
                user={user}
                onRestart={() => setView('practice')}
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
