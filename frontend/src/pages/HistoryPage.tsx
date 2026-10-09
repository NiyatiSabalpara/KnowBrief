import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  ExternalLink, 
  Brain, 
  RefreshCw, 
  FileText, 
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface HistoryPageProps {
  onSelectArticle: (articleId: number) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectArticle }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalysisHistory(100);
      setHistory(res.history || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (articleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this article and its NLP analysis records?')) return;
    try {
      setDeletingId(articleId);
      await api.deleteArticle(articleId);
      setHistory(prev => prev.filter(h => h.article_id !== articleId));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.publisher.toLowerCase().includes(q) ||
      (item.topic && item.topic.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Saved Articles & Analysis History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted articles with stored NLP extractions, knowledge triples, and entity relations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search saved analyses..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
          <p className="text-xs">Loading database records...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
          <History className="w-10 h-10 text-slate-600 mb-2" />
          <p className="font-semibold text-slate-300">No Saved Articles Found</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Analyzed articles are permanently saved in your SQLite database and appear here for instant review.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden bg-slate-950/80 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="p-3.5 font-semibold">Article Headline</th>
                  <th className="p-3.5 font-semibold">Publisher</th>
                  <th className="p-3.5 font-semibold">Topic</th>
                  <th className="p-3.5 font-semibold">Word Count</th>
                  <th className="p-3.5 font-semibold">Analyzed Date</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.analysis_id}
                    onClick={() => onSelectArticle(item.article_id)}
                    className="hover:bg-slate-900/50 cursor-pointer transition"
                  >
                    <td className="p-3.5 max-w-md">
                      <div className="font-bold text-slate-100 hover:text-emerald-400 transition line-clamp-1">
                        {item.title}
                      </div>
                      {item.summary_preview && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.summary_preview}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
                        {item.publisher}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-bold font-mono">
                        {item.topic || 'General'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {item.word_count} words
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectArticle(item.article_id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.article_id, e)}
                        disabled={deletingId === item.article_id}
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
