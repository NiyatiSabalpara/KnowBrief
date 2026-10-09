import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { GraphData } from '../types';
import { LearningGraphExplorer } from '../components/LearningGraphExplorer';

export const GlobalGraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], stats: { total_nodes: 0, total_edges: 0, density: 0 } });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGlobalGraph({ limit: 300 });
      setGraphData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch global knowledge graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalGraph();
  }, []);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Cross-Source Entity Network</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Graph</h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore people, organizations, places, and relationships extracted from analyzed news articles.
          </p>
        </div>

        <button
          onClick={fetchGlobalGraph}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Reload graph</span>
        </button>
      </div>

      {loading ? (
        <div className="py-28 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-200">Assembling Global Knowledge Graph...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      ) : (
        <LearningGraphExplorer
          graphData={graphData}
          height="650px"
        />
      )}
    </div>
  );
};
