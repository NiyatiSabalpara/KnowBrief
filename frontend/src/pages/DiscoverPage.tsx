import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  Brain, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { NewsArticle, NewsSource } from '../types';

interface DiscoverPageProps {
  onAnalyzeArticle: (articleId: number) => void;
}

const TOPICS = [
  'All',
  'Technology and AI',
  'Business and Economy',
  'Finance and Markets',
  'Politics and Government',
  'Healthcare',
  'Science',
  'Environment',
  'Sports',
  'International Affairs'
];

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onAnalyzeArticle }) => {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  // Direct Ingest Modals / Tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'url' | 'text'>('feed');
  const [directUrl, setDirectUrl] = useState<string>('');
  const [urlLoading, setUrlLoading] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Direct Text Form
  const [textTitle, setTextTitle] = useState<string>('');
  const [textBody, setTextBody] = useState<string>('');
  const [textSource, setTextSource] = useState<string>('Custom Submission');
  const [textCategory, setTextCategory] = useState<string>('Technology and AI');
  const [textLoading, setTextLoading] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Load sources on mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const srcList = await api.getSources();
        setSources(srcList);
      } catch (e) {
        console.error('Failed to fetch sources:', e);
      }
    };
    fetchSources();
  }, []);

  // Fetch articles on filter change
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.searchNews({
        q: searchQuery.trim() || undefined,
        category: selectedTopic !== 'All' ? selectedTopic : undefined,
        source: selectedSources.length > 0 ? selectedSources.join(',') : undefined,
        limit: 35
      });
      setArticles(res.articles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchArticles();
    }
  }, [selectedTopic, selectedSources]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const toggleSource = (code: string) => {
    setSelectedSources(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleAnalyzeClick = async (articleId: number) => {
    try {
      setAnalyzingId(articleId);
      onAnalyzeArticle(articleId);
    } catch (err) {
      setAnalyzingId(null);
    }
  };

  const handleDirectUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    try {
      setUrlLoading(true);
      setUrlError(null);
      const res = await api.analyzeDirectUrl(directUrl.trim());
      onAnalyzeArticle(res.article_id);
    } catch (err: any) {
      setUrlError(err.response?.data?.detail || err.message || 'Failed to extract and analyze URL.');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleDirectTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle.trim() || !textBody.trim()) {
      setTextError('Please provide both an article title and text body.');
      return;
    }
    try {
      setTextLoading(true);
      setTextError(null);
      const res = await api.analyzeDirectText({
        title: textTitle.trim(),
        text: textBody.trim(),
        source_name: textSource.trim(),
        category: textCategory
      });
      onAnalyzeArticle(res.article_id);
    } catch (err: any) {
      setTextError(err.response?.data?.detail || err.message || 'Failed to analyze provided text.');
    } finally {
      setTextLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Discover & Ingest Live News</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time news ingestion from Financial Times, Times of India, Hindustan Times, BBC News, The Hindu, and Reuters.
          </p>
        </div>

        {/* Ingestion Mode Toggle Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'feed'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live RSS Feeds</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'url'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Direct URL</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'text'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text</span>
          </button>
        </div>
      </div>

      {/* Direct URL Ingestion View */}
      {activeTab === 'url' && (
        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 max-w-2xl mx-auto shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <LinkIcon className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Direct URL Article Ingestion</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Enter the URL of any public web news article. Our readability engine (Trafilatura & BeautifulSoup) will extract the article, strip boilerplate ads, and run the complete NLP pipeline.
          </p>

          <form onSubmit={handleDirectUrlSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Article URL</label>
              <input
                type="url"
                required
                placeholder="https://timesofindia.indiatimes.com/technology/article..."
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            {urlError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{urlError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={urlLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition"
            >
              {urlLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Text & Running NLP Pipeline...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Fetch, Extract & Analyze</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Direct Text Ingestion View */}
      {activeTab === 'text' && (
        <div className="rounded-2xl glass-panel border border-slate-800 p-6 bg-slate-950/80 max-w-3xl mx-auto shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Paste Article Text (Paywall Fallback)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            For paywalled sources like Financial Times or private reports, paste the authorized article text directly to execute NLP analysis.
          </p>

          <form onSubmit={handleDirectTextSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Article Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI Announces Next-Gen Reasoning Model"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source / Publication Name</label>
                <input
                  type="text"
                  placeholder="e.g. Financial Times / Reuters"
                  value={textSource}
                  onChange={(e) => setTextSource(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Article Text Content</label>
              <textarea
                rows={8}
                required
                placeholder="Paste the complete article paragraphs here..."
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {textError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{textError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={textLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition"
            >
              {textLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing NLP Pipeline...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Run NLP Knowledge Extraction</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Live Feed View */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-1 space-y-5">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search headlines or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </form>

            {/* Source Checkboxes */}
            <div className="rounded-xl glass-panel border border-slate-800 p-4 bg-slate-950/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Publishers</span>
                {selectedSources.length > 0 && (
                  <button
                    onClick={() => setSelectedSources([])}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sources.map((src) => (
                  <label
                    key={src.code}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900/60 cursor-pointer text-xs group"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(src.code)}
                        onChange={() => toggleSource(src.code)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-slate-300 group-hover:text-white font-medium">{src.name}</span>
                    </div>
                    {src.requires_auth ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        Paywall
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Topic Pills */}
            <div className="rounded-xl glass-panel border border-slate-800 p-4 bg-slate-950/70">
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3 pb-2 border-b border-slate-800">
                Topics & Domains
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      selectedTopic === topic
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Feed Articles Grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                Found <span className="text-white font-bold">{articles.length}</span> live articles
              </span>
              <button
                onClick={fetchArticles}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Refresh News</span>
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-200">Fetching live RSS feeds from publishers...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            ) : articles.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
                <Radio className="w-10 h-10 text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No Articles Match Your Filters</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Try clearing your search query, choosing 'All' topics, or unchecking publisher constraints.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="flex flex-col justify-between rounded-xl glass-panel border border-slate-800 p-4 bg-slate-950/80 glass-panel-hover shadow-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {art.publisher}
                        </span>
                        <span className="text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{art.published_at ? new Date(art.published_at).toLocaleDateString() : 'Recent'}</span>
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug hover:text-emerald-400 transition">
                        {art.title}
                      </h3>

                      {/* Snippet */}
                      {art.description && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {art.description.replace(/<[^>]+>/g, '')}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px] font-medium transition"
                      >
                        <span>Open Original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleAnalyzeClick(art.id)}
                        disabled={analyzingId === art.id}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
                      >
                        {analyzingId === art.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3.5 h-3.5" />
                            <span>{art.is_analyzed ? 'View Analysis' : 'Analyze Article'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
