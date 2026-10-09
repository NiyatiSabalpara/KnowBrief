import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Network,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { CrossArticleComparisonResponse } from '../types';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';

export const CrossArticlePage: React.FC = () => {
  const [historyArticles, setHistoryArticles] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparison, setComparison] = useState<CrossArticleComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingHistory, setFetchingHistory] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setFetchingHistory(true);
        const res = await api.getAnalysisHistory(40);
        setHistoryArticles(res.history || []);
        // Pre-select first 2 articles if available
        if (res.history && res.history.length >= 2) {
          setSelectedIds([res.history[0].article_id, res.history[1].article_id]);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setFetchingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleToggleSelect = (artId: number) => {
    setSelectedIds(prev => 
      prev.includes(artId) ? prev.filter(id => id !== artId) : [...prev, artId]
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 analyzed articles to compare.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.compareArticles(selectedIds);
      setComparison(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial compare if default IDs selected
  useEffect(() => {
    if (selectedIds.length >= 2 && !comparison && !loading) {
      handleCompare();
    }
  }, [selectedIds.length]);

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <GitCompare className="w-4 h-4" />
          <span>Multi-Source Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cross-Article Knowledge Explorer</h1>
        <p className="text-xs text-slate-400 mt-1">
          Compare multiple articles covering the same event to extract overlapping entities, identify divergent claims, calculate semantic similarity, and synthesize a cross-source knowledge graph.
        </p>
      </div>

      {/* Article Selection Panel */}
      <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Select Articles to Compare ({selectedIds.length} Selected)
            </h3>
            <p className="text-[11px] text-slate-400">Choose 2 or more articles from your analyzed library</p>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading || selectedIds.length < 2}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Compare Selected Articles</span>
          </button>
        </div>

        {fetchingHistory ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading analyzed articles...</div>
        ) : historyArticles.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No analyzed articles found. Please analyze at least two articles first in Discover News.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
            {historyArticles.map((art) => {
              const isSelected = selectedIds.includes(art.article_id);
              return (
                <div
                  key={art.article_id}
                  onClick={() => handleToggleSelect(art.article_id)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-xs flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <div className="overflow-hidden">
                    <span className="font-semibold line-clamp-1">{art.title}</span>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
                      <span className="text-emerald-400">{art.publisher}</span>
                      <span>•</span>
                      <span>{art.topic}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Synthesized Cross-Source Summary Card */}
          <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Cross-Source Synthesized Summary</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {comparison.synthesized_summary}
            </p>
          </div>

          {/* Potential Discrepancies Alert */}
          {comparison.potential_discrepancies.length > 0 && (
            <div className="rounded-2xl glass-panel border border-amber-500/30 p-5 bg-amber-950/20">
              <div className="flex items-center space-x-2 text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Potential Discrepancies Detected</h4>
              </div>
              <div className="space-y-2">
                {comparison.potential_discrepancies.map((disc, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/20 text-xs text-slate-300">
                    <span className="font-semibold text-amber-300">{disc.type}: </span>
                    <span>{disc.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overlapping Entities & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shared Entities */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <h4 className="text-sm font-bold text-white mb-3">Shared Entities Across Sources</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {comparison.shared_entities.length === 0 ? (
                  <p className="text-xs text-slate-500">No overlapping entities found across these articles.</p>
                ) : (
                  comparison.shared_entities.map((ent, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <div>
                        <span className="font-bold text-white">{ent.name}</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                          {ent.type}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">
                        {ent.sources_count} sources
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shared Keywords */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <h4 className="text-sm font-bold text-white mb-3">Shared Keywords & Concepts</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {comparison.shared_keywords.length === 0 ? (
                  <p className="text-xs text-slate-500">No overlapping keywords found.</p>
                ) : (
                  comparison.shared_keywords.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-200 font-medium">{kw.keyword}</span>
                      <span className="text-blue-400 font-mono text-[10px] font-bold">
                        {kw.sources_count} sources
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pairwise Semantic Cosine Similarity Heatmap */}
          <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
            <h4 className="text-sm font-bold text-white mb-1">Pairwise Article Semantic Similarity Matrix</h4>
            <p className="text-xs text-slate-400 mb-4">TF-IDF vector space cosine similarity between articles</p>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-sans text-slate-400">Article</th>
                    {comparison.article_titles.map((title, i) => (
                      <th key={i} className="p-2 text-slate-300 font-sans max-w-[120px] truncate" title={title}>
                        Art {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.similarity_matrix.map((row, i) => (
                    <tr key={i} className="border-t border-slate-800/60">
                      <td className="p-2 text-left font-sans text-slate-300 font-medium max-w-[160px] truncate" title={comparison.article_titles[i]}>
                        Art {i + 1}: {comparison.article_titles[i]}
                      </td>
                      {row.map((val, j) => {
                        const bgIntensity = Math.round(val * 100);
                        return (
                          <td
                            key={j}
                            className="p-2 font-bold"
                            style={{
                              backgroundColor: `rgba(34, 197, 94, ${val * 0.4})`,
                              color: val > 0.7 ? '#ffffff' : '#94a3b8'
                            }}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combined Multi-Article Knowledge Graph */}
          <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
            <h4 className="text-sm font-bold text-white mb-2">Synthesized Multi-Article Knowledge Graph</h4>
            <KnowledgeGraphView graphData={comparison.combined_graph} height="600px" showExport={false} />
          </div>
        </div>
      )}
    </div>
  );
};
