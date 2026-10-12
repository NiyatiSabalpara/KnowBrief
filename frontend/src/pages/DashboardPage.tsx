import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Brain, 
  Network, 
  Activity, 
  Radio, 
  ArrowRight, 
  RefreshCw, 
  TrendingUp, 
  Globe, 
  Search,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { TopicChart } from '../components/TopicChart';
import { EntityDistributionChart } from '../components/EntityDistributionChart';

interface DashboardPageProps {
  onNavigate: (tab: string, articleId?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const summaryCards = [
    {
      title: 'Total Articles Ingested',
      value: stats?.summary.total_articles || 0,
      icon: FileText,
      color: 'from-blue-600/20 to-blue-400/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Analyzed with NLP',
      value: stats?.summary.total_analyzed || 0,
      icon: Brain,
      color: 'from-emerald-600/20 to-emerald-400/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Knowledge Triples (SPO)',
      value: stats?.summary.total_triples || 0,
      icon: Network,
      color: 'from-amber-600/20 to-amber-400/5',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Extracted Named Entities',
      value: stats?.summary.total_entities || 0,
      icon: Activity,
      color: 'from-purple-600/20 to-purple-400/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Structured Events',
      value: stats?.summary.total_events || 0,
      icon: TrendingUp,
      color: 'from-rose-600/20 to-rose-400/5',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
    },
    {
      title: 'News Publishers Monitored',
      value: stats?.summary.total_sources || 0,
      icon: Radio,
      color: 'from-cyan-600/20 to-cyan-400/5',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
  ];

  // Convert top entities list to object for chart
  const entityDistObj: Record<string, number> = {};
  stats?.top_entities?.forEach(e => {
    entityDistObj[e.name] = e.count;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl glass-panel border border-slate-800 p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              KnowBrief
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Turn news articles into summaries, entities, events, relationships, and interactive knowledge graphs.
            </p>

            {/* Quick Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('discover')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Discover News</span>
              </button>
              <button
                onClick={() => onNavigate('graph')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition"
              >
                <Network className="w-4 h-4 text-emerald-400" />
                <span>Explore Knowledge Graph</span>
              </button>
              <button
                onClick={() => onNavigate('compare')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Cross-Article Explorer</span>
              </button>
            </div>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="self-start md:self-center flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`relative rounded-xl p-4 glass-panel border ${card.borderColor} bg-gradient-to-b ${card.color} glass-panel-hover shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className="mt-2 text-2xl font-bold text-white font-mono">
                {loading ? '...' : card.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Breakdown */}
        <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Analyzed Topic Distribution</h3>
              <p className="text-xs text-slate-400">Across 10 topic areas</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Cosine Taxonomy
            </span>
          </div>
          <TopicChart data={stats?.topic_distribution || []} />
        </div>

        {/* Top Named Entities */}
        <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Most Frequent Named Entities</h3>
              <p className="text-xs text-slate-400">Aggregated mentions across analyzed articles</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              spaCy NER
            </span>
          </div>
          <EntityDistributionChart distribution={entityDistObj} />
        </div>
      </div>

      {/* Recent Analyzed Articles Table */}
      <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recently Analyzed Articles</h3>
            <p className="text-xs text-slate-400">Click to inspect complete NLP analysis results and knowledge graphs</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(!stats?.recent_articles || stats.recent_articles.length === 0) ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <Brain className="w-10 h-10 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No Articles Analyzed Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Start by discovering live news from Financial Times, Times of India, BBC, or pasting an article text.
            </p>
            <button
              onClick={() => onNavigate('discover')}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Discover News Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Headline</th>
                  <th className="pb-3 font-semibold">Publisher</th>
                  <th className="pb-3 font-semibold">Topic</th>
                  <th className="pb-3 font-semibold">Words / Tokens</th>
                  <th className="pb-3 font-semibold">Latency</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recent_articles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 pr-4 max-w-md">
                      <div className="font-medium text-slate-100 hover:text-emerald-400 cursor-pointer line-clamp-1"
                           onClick={() => onNavigate('analysis', art.id)}>
                        {art.title}
                      </div>
                    </td>
                    <td className="py-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {art.publisher}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[11px] font-medium">
                        {art.topic}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {art.word_count} words
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {Math.round(art.execution_time_ms)} ms
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigate('analysis', art.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
