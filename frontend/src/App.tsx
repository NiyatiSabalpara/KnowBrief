import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EditorialHome } from './pages/EditorialHome';
import { DiscoverPage } from './pages/DiscoverPage';
import { ArticleAnalysisPage } from './pages/ArticleAnalysisPage';
import { GlobalGraphPage } from './pages/GlobalGraphPage';
import { CrossArticlePage } from './pages/CrossArticlePage';
import { HistoryPage } from './pages/HistoryPage';
import { TechnicalInsightsPage } from './pages/TechnicalInsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [analyzedCount, setAnalyzedCount] = useState<number>(0);

  // Sync count on mount and tab changes
  const refreshStats = async () => {
    try {
      const stats = await api.getDashboardStats();
      setAnalyzedCount(stats.summary.total_analyzed);
    } catch (e) {
      // Ignore initial failure if server starting
    }
  };

  useEffect(() => {
    refreshStats();
  }, [activeTab]);

  const handleNavigate = (tab: string, articleId?: number) => {
    if (articleId !== undefined) {
      setSelectedArticleId(articleId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (articleId: number) => {
    setSelectedArticleId(articleId);
    setActiveTab('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen editorial-app text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        analyzedCount={analyzedCount}
      />

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <EditorialHome onNavigate={handleNavigate} />
        )}

        {activeTab === 'discover' && (
          <DiscoverPage onAnalyzeArticle={handleSelectArticle} />
        )}

        {activeTab === 'analysis' && (
          <ArticleAnalysisPage
            articleId={selectedArticleId}
            onSelectArticle={handleSelectArticle}
          />
        )}

        {activeTab === 'graph' && (
          <GlobalGraphPage />
        )}

        {activeTab === 'compare' && (
          <CrossArticlePage />
        )}

        {activeTab === 'history' && (
          <HistoryPage onSelectArticle={handleSelectArticle} />
        )}

        {activeTab === 'insights' && (
          <TechnicalInsightsPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#171717] py-6 text-center text-xs text-slate-400">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AI News-to-Knowledge Converter • Academic NLP Project</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>spaCy 3.8</span>
            <span>•</span>
            <span>NLTK</span>
            <span>•</span>
            <span>scikit-learn</span>
            <span>•</span>
            <span>NetworkX</span>
            <span>•</span>
            <span>FastAPI</span>
            <span>•</span>
            <span>React + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

