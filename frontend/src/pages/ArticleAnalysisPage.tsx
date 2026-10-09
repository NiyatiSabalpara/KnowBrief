import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  Tag, 
  Sparkles, 
  Network, 
  Calendar, 
  DollarSign, 
  Link as LinkIcon, 
  Download, 
  RefreshCw, 
  Layers, 
  GitBranch, 
  ShieldCheck, 
  Share2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { ArticleAnalysisResponse } from '../types';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';
import { EntityDistributionChart } from '../components/EntityDistributionChart';

interface ArticleAnalysisPageProps {
  articleId: number | null;
  onSelectArticle: (id: number) => void;
}

export const ArticleAnalysisPage: React.FC<ArticleAnalysisPageProps> = ({ articleId, onSelectArticle }) => {
  const [analysis, setAnalysis] = useState<ArticleAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recomputing, setRecomputing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active Analysis Sub-Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'entities' | 'keywords' | 'events' | 'relations' | 'coref' | 'graph' | 'financial' | 'preprocessing'
  >('overview');

  // Summary length selector
  const [summaryMode, setSummaryMode] = useState<'short' | 'medium' | 'detailed'>('medium');

  const loadAnalysis = async (force: boolean = false) => {
    if (!articleId) return;
    try {
      if (force) setRecomputing(true);
      else setLoading(true);
      setError(null);
      const res = await api.analyzeArticle(articleId, force);
      setAnalysis(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to complete NLP analysis on article.');
    } finally {
      setLoading(false);
      setRecomputing(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      loadAnalysis();
    }
  }, [articleId]);

  if (!articleId) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400 glass-panel rounded-2xl border border-slate-800 animate-fadeIn">
        <Brain className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-lg font-bold text-white">No Article Selected</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select an article from the Discover News or Saved Articles tab to view its NLP extraction and Knowledge Graph.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center text-center text-slate-400">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-white">Executing Multi-Stage NLP Pipeline...</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Performing sentence segmentation, POS tagging, NER entity extraction, TextRank graph summarization, event frame detection, and Knowledge Graph construction.
        </p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        <h3 className="font-bold text-sm text-rose-200 mb-1">Analysis Error</h3>
        <p>{error || 'Unable to retrieve analysis results.'}</p>
        <button
          onClick={() => loadAnalysis(true)}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-white font-semibold transition"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header Bar */}
      <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
              {analysis.publisher}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {analysis.published_at ? new Date(analysis.published_at).toLocaleDateString() : 'N/A'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">{analysis.word_count} words</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-mono font-semibold">{Math.round(analysis.execution_time_ms)} ms</span>
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center space-x-2">
            <a
              href={api.getExportUrl(analysis.article_id, 'html')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>HTML Report</span>
            </a>
            <a
              href={api.getExportUrl(analysis.article_id, 'json')}
              download
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>JSON</span>
            </a>
            <a
              href={api.getExportUrl(analysis.article_id, 'csv_triples')}
              download
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>CSV Triples</span>
            </a>
            <button
              onClick={() => loadAnalysis(true)}
              disabled={recomputing}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition flex items-center space-x-1.5"
              title="Force recompute NLP pipeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
              <span>Re-run</span>
            </button>
          </div>
        </div>

        {/* Headline and Link */}
        <div className="mt-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            {analysis.article_title}
          </h1>
          <a
            href={analysis.article_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center space-x-1.5 text-slate-400 hover:text-emerald-400 text-xs transition"
          >
            <span className="line-clamp-1">{analysis.article_url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-800/80 pb-1">
          {[
            { id: 'overview', label: 'Overview & Summary', icon: FileText },
            { id: 'entities', label: `Entities (${analysis.entities.length})`, icon: Tag },
            { id: 'keywords', label: 'Keywords & Topics', icon: Sparkles },
            { id: 'events', label: `Events (${analysis.events.length})`, icon: Calendar },
            { id: 'relations', label: `Triples (${analysis.triples.length})`, icon: GitBranch },
            { id: 'coref', label: `Coreference (${analysis.coreference.length})`, icon: Layers },
            { id: 'graph', label: 'Knowledge Graph', icon: Network },
            { id: 'financial', label: 'Financial Analytics', icon: DollarSign },
            { id: 'preprocessing', label: 'NLP Preprocessing & POS', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SUMMARIES */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Summaries Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span>Extractive TextRank Summary</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Graph centrality sentence ranking based on cosine lexical salience</p>
                </div>

                {/* Length Selector */}
                <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold">
                  {(['short', 'medium', 'detailed'] as const).map((len) => (
                    <button
                      key={len}
                      onClick={() => setSummaryMode(len)}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition capitalize ${
                        summaryMode === len ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-200 text-sm leading-relaxed">
                {summaryMode === 'short' && (analysis.summaries.short || 'Summary not available.')}
                {summaryMode === 'medium' && (analysis.summaries.medium || 'Summary not available.')}
                {summaryMode === 'detailed' && (analysis.summaries.detailed || 'Summary not available.')}
              </div>
            </div>

            {/* Quick Triples Teaser */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  <span>Key Knowledge Triples (Subject → Predicate → Object)</span>
                </h3>
                <button
                  onClick={() => setActiveTab('relations')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  View All ({analysis.triples.length})
                </button>
              </div>

              <div className="space-y-2">
                {analysis.triples.slice(0, 4).map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="font-mono">
                      <span className="text-emerald-300 font-bold">{t.subject}</span>
                      <span className="text-amber-400 mx-2 font-semibold">→ {t.predicate} →</span>
                      <span className="text-blue-300 font-bold">{t.object}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {Math.round(t.confidence * 100)}% Conf
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Meta Column */}
          <div className="space-y-6">
            {/* Primary Topic Card */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Classified Domain
              </span>
              <div className="flex items-center justify-between mt-1">
                <h4 className="text-lg font-bold text-emerald-400">{analysis.topic.primary_topic}</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  {Math.round(analysis.topic.confidence * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{analysis.topic.method}</p>

              {analysis.topic.topic_phrases.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Matched Taxonomic Keywords:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.topic.topic_phrases.map((tp, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                        {tp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Entity Distribution */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <h4 className="text-sm font-bold text-white mb-2">Named Entity Distribution</h4>
              <EntityDistributionChart distribution={analysis.entity_distribution} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXTRACTED ENTITIES */}
      {activeTab === 'entities' && (
        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Extracted Named Entities with Contextual Grounding</h3>
              <p className="text-xs text-slate-400">Classified using spaCy with supporting sentence evidence</p>
            </div>
            <a
              href={api.getExportUrl(analysis.article_id, 'csv_entities')}
              download
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Entity</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Mentions</th>
                  <th className="pb-3 font-semibold">Contextual Evidence Sentence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analysis.entities.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 font-bold text-white pr-4">{ent.text}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700 font-mono text-[10px] font-semibold">
                        {ent.label}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono pr-4">{ent.frequency}</td>
                    <td className="py-3 text-slate-300 italic text-[11px] max-w-md">
                      "{ent.context_sentence || 'N/A'}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KEYWORDS & TOPICS */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TF-IDF Keywords */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <div className="pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-sm font-bold text-white">1. TF-IDF Keywords</h4>
                <p className="text-[11px] text-slate-400">Sublinear term frequency with POS filtering</p>
              </div>
              <div className="space-y-2">
                {analysis.keywords.tfidf.map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-200 font-medium">{kw.keyword}</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-semibold">{kw.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TextRank Keywords */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <div className="pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-sm font-bold text-white">2. TextRank Graph Keywords</h4>
                <p className="text-[11px] text-slate-400">Co-occurrence word graph + PageRank</p>
              </div>
              <div className="space-y-2">
                {analysis.keywords.textrank.map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-200 font-medium">{kw.keyword}</span>
                    <span className="font-mono text-[10px] text-blue-400 font-semibold">{kw.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KeyBERT Semantic Keywords */}
            <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
              <div className="pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-sm font-bold text-white">3. Semantic KeyBERT</h4>
                <p className="text-[11px] text-slate-400">Vector space candidate cosine similarity</p>
              </div>
              <div className="space-y-2">
                {analysis.keywords.semantic_keybert.map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-200 font-medium">{kw.keyword}</span>
                    <span className="font-mono text-[10px] text-purple-400 font-semibold">{kw.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Topic Probability Breakdown */}
          <div className="rounded-2xl glass-panel border border-slate-800 p-5 bg-slate-950/80">
            <h4 className="text-sm font-bold text-white mb-3">Domain Taxonomy Probabilities</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(analysis.topic.all_scores).map(([topic, score]) => (
                <div key={topic} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="text-slate-400 text-[11px] line-clamp-1">{topic}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-white font-bold font-mono">{Math.round((score as number) * 100)}%</span>
                  </div>
                  <div className="mt-1.5 w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((score as number) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STRUCTURED EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Extracted Events & Predicate-Argument Structures</h3>
            <a
              href={api.getExportUrl(analysis.article_id, 'csv_events')}
              download
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Events CSV</span>
            </a>
          </div>

          {analysis.events.length === 0 ? (
            <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
              No distinct event frames (acquisitions, launches, investments, appointments) found in this text.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.events.map((ev, idx) => (
                <div key={idx} className="rounded-xl glass-panel border border-slate-800 p-4 bg-slate-950/80 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                      {ev.event_type}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      {Math.round(ev.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    {ev.actor_acquirer && (
                      <div><span className="text-slate-400">Actor / Initiator:</span> <span className="text-white font-semibold">{ev.actor_acquirer}</span></div>
                    )}
                    <div><span className="text-slate-400">Action:</span> <span className="text-emerald-400 font-semibold">{ev.action}</span></div>
                    {ev.target_object && (
                      <div><span className="text-slate-400">Target / Object:</span> <span className="text-white font-semibold">{ev.target_object}</span></div>
                    )}
                    {ev.financial_value && (
                      <div><span className="text-slate-400">Financial Value:</span> <span className="text-amber-400 font-bold font-mono">{ev.financial_value}</span></div>
                    )}
                    {ev.event_date && (
                      <div><span className="text-slate-400">Date:</span> <span className="text-slate-300">{ev.event_date}</span></div>
                    )}
                    {ev.location && (
                      <div><span className="text-slate-400">Location:</span> <span className="text-slate-300">{ev.location}</span></div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                    "{ev.supporting_sentence}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RELATIONSHIPS & KNOWLEDGE TRIPLES */}
      {activeTab === 'relations' && (
        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Subject-Predicate-Object Knowledge Triples</h3>
              <p className="text-xs text-slate-400">Derived via Syntactic Dependency Parsing and Predicate Analysis</p>
            </div>
            <a
              href={api.getExportUrl(analysis.article_id, 'csv_triples')}
              download
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Predicate</th>
                  <th className="pb-3 font-semibold">Object</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Evidence Sentence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {analysis.triples.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 text-emerald-300 font-bold pr-4">{t.subject}</td>
                    <td className="py-3 text-amber-400 font-bold pr-4">{t.predicate}</td>
                    <td className="py-3 text-blue-300 font-bold pr-4">{t.object}</td>
                    <td className="py-3 text-slate-400 pr-4">{Math.round(t.confidence * 100)}%</td>
                    <td className="py-3 font-sans text-slate-300 italic text-[11px] max-w-md">
                      "{t.supporting_sentence}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: COREFERENCE RESOLUTION */}
      {activeTab === 'coref' && (
        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Anaphora & Coreference Resolution Chains</h3>
            <p className="text-xs text-slate-400">Connecting pronouns and definite nominals to antecedent named entities</p>
          </div>

          {analysis.coreference.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No cross-sentence pronoun chains resolved for this text.
            </div>
          ) : (
            <div className="space-y-4">
              {analysis.coreference.map((chain, idx) => (
                <div key={idx} className="rounded-xl glass-panel border border-slate-800 p-4 bg-slate-900/60">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-bold text-sm">{chain.representative_entity}</span>
                    {chain.entity_type && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {chain.entity_type}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1.5">
                    <span>Resolved Mentions:</span>
                    {chain.mentions.map((m, mIdx) => (
                      <span key={mIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                        {m}
                      </span>
                    ))}
                  </div>

                  {chain.resolved_sentence_examples.length > 0 && (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Sentence Resolution Demonstration:</span>
                      {chain.resolved_sentence_examples.map((ex, exIdx) => (
                        <div key={exIdx} className="p-2.5 rounded bg-slate-950 text-xs border border-slate-800/80">
                          <div className="text-slate-400 text-[11px] line-through">"{ex.original_sentence}"</div>
                          <div className="text-emerald-300 font-medium text-[11px] mt-1">→ "{ex.resolved_sentence}"</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: INTERACTIVE KNOWLEDGE GRAPH */}
      {activeTab === 'graph' && (
        <KnowledgeGraphView
          graphData={analysis.graph}
          height="620px"
          onExportGraphML={() => {
            window.location.href = api.getExportUrl(analysis.article_id, 'graphml');
          }}
        />
      )}

      {/* TAB 8: FINANCIAL ANALYTICS */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Financial & Numerical Extraction</h3>
                <p className="text-xs text-slate-400">{analysis.financial.summary}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                Tone: {analysis.financial.market_sentiment}
              </span>
            </div>

            {/* Numerical Claims Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Metric / Valuation</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Context Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysis.financial.numerical_claims.map((claim, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 font-mono font-bold text-amber-400 pr-4">{claim.raw_value}</td>
                      <td className="py-3 text-slate-300 pr-4">{claim.metric_type}</td>
                      <td className="py-3 text-slate-300 italic text-[11px]">"{claim.context_sentence}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: PREPROCESSING & TECHNICAL INSIGHTS */}
      {activeTab === 'preprocessing' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Stage 1 Preprocessing & POS Tagger Inspector</h3>
                <p className="text-xs text-slate-400">
                  Total Sentences: <b className="text-white">{analysis.preprocessing.sentence_count}</b> | Total Tokens: <b className="text-white">{analysis.preprocessing.token_count}</b>
                </p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold sticky top-0 bg-slate-950">
                    <th className="pb-2">Token Text</th>
                    <th className="pb-2">Lemma</th>
                    <th className="pb-2">Universal POS</th>
                    <th className="pb-2">Fine POS Tag</th>
                    <th className="pb-2">Stopword</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {analysis.preprocessing.sample_tokens.map((tok, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-2 text-white font-medium">{tok.text}</td>
                      <td className="py-2 text-slate-400">{tok.lemma}</td>
                      <td className="py-2 text-emerald-400">{tok.pos}</td>
                      <td className="py-2 text-cyan-400">{tok.tag}</td>
                      <td className="py-2">{tok.is_stop ? <span className="text-rose-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
