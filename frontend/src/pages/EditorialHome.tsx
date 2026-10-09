import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Brain, Clock3, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { NewsArticle } from '../types';

const sections = ['Top Stories', 'World', 'India', 'Politics', 'Business', 'Markets', 'Technology', 'Science', 'Health', 'Sports', 'Environment'];
const categoryFilters: Record<string, string> = {
  World: 'International Affairs', India: 'Politics and Government', Politics: 'Politics and Government',
  Business: 'Business and Economy', Markets: 'Finance and Markets', Technology: 'Technology and AI', Health: 'Healthcare',
};
const clean = (value?: string | null) => (value || '').replace(/<[^>]*>/g, '').trim();

export const EditorialHome: React.FC<{ onNavigate: (tab: string, articleId?: number) => void }> = ({ onNavigate }) => {
  const [category, setCategory] = useState('Top Stories');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async (selected: string) => {
    setLoading(true); setError('');
    try {
      const result = await api.searchNews({ category: selected === 'Top Stories' ? undefined : (categoryFilters[selected] || selected), limit: 30 });
      setArticles(result.articles || []);
    } catch (e: any) { setError(e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT' ? 'News is taking too long to respond. Check that the news backend is running, then try again.' : e?.response?.data?.detail || e?.message || 'News could not be loaded. Please try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(category); }, [category]);
  const featured = articles[0];
  const supporting = articles.slice(1, 5);
  const localDate = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()), []);
  const date = (article: NewsArticle) => article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Latest';
  const image = (article: NewsArticle, cls = '') => article.thumbnail_url ? <img className={`story-image ${cls}`} src={article.thumbnail_url} alt={`Image for ${article.title}`} loading="lazy" /> : <div className={`story-image story-image-fallback ${cls}`} aria-label="No image provided by publisher"><span>KNOWLEDGE / NEWS</span></div>;
  const analyze = (article: NewsArticle) => onNavigate('analysis', article.id);
  return <div className="editorial-home">
    <div className="date-line"><span>{localDate}</span><span>Independent perspective. Connected knowledge.</span><button onClick={() => void load(category)} disabled={loading} className="refresh-link"><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button></div>
    <div className="section-tabs" aria-label="News categories">{sections.map((item, i) => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'selected' : ''}>{item}</button>)}</div>
    <div className="editorial-heading"><div><span className="eyebrow">THE DAILY BRIEFING</span><h1>Stories that shape<br className="desktop-break"/> the way we see the world.</h1></div><p>Real reporting, made easier to explore.<br/>Every story connected to the facts within it.</p></div>
    {loading ? <div className="editorial-state"><RefreshCw className="spin" /><p>Gathering the latest stories from your publishers…</p></div> : error ? <div className="editorial-state error-state"><p>{error}</p><button className="gold-button" onClick={() => void load(category)}>Try again</button></div> : articles.length === 0 ? <div className="editorial-state"><p>No stories are available in this section right now.</p><button className="gold-button" onClick={() => setCategory('Top Stories')}>View top stories</button></div> : <>
      <section className="lead-grid" aria-label="Featured news">
        <article className="lead-story" onClick={() => analyze(featured)}>
          {image(featured, 'lead-photo')}<div className="lead-overlay" />
          <div className="lead-copy"><span className="story-kicker">{featured.category || category} <i/> {featured.publisher}</span><h2>{featured.title}</h2><p>{clean(featured.description) || 'Explore the latest reporting and discover the people, events, and facts behind this story.'}</p><div className="story-meta">{date(featured)} <i/> {featured.word_count ? `${Math.max(1, Math.round(featured.word_count / 220))} min read` : 'Latest update'}</div><div className="lead-actions"><a href={featured.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="gold-button">Read story <ArrowUpRight size={15}/></a><button onClick={e => { e.stopPropagation(); analyze(featured); }} className="outline-button"><Brain size={15}/> Analyze article</button></div></div>
        </article>
        <aside className="supporting-stories"><div className="aside-title"><span>ALSO IN THE NEWS</span><span>{String(supporting.length).padStart(2, '0')} STORIES</span></div>{supporting.length ? supporting.map((article, i) => <article key={article.id} className={`support-card ${i === 0 ? 'support-large' : ''}`} onClick={() => analyze(article)}>{i === 0 && image(article)}<div><span className="story-kicker">{article.publisher} <i/> {date(article)}</span><h3>{article.title}</h3>{i === 0 && article.description && <p>{clean(article.description)}</p>}</div><ArrowUpRight size={16} className="support-arrow"/></article>) : <p className="muted-note">More stories will appear when publishers return results.</p>}</aside>
      </section>
      <section className="latest-section"><div className="section-title"><div><span className="eyebrow">A CLOSER LOOK</span><h2>{category === 'Top Stories' ? 'Latest news' : category}</h2></div><button onClick={() => onNavigate('discover')}>Explore all news <ArrowUpRight size={15}/></button></div><div className="news-grid">{articles.slice(5).map(article => <article key={article.id} className="news-card" onClick={() => analyze(article)}>{image(article)}<div className="news-card-copy"><span className="story-kicker">{article.publisher} <i/> {date(article)}</span><h3>{article.title}</h3><p>{clean(article.description) || 'Open this story to explore its reporting and related knowledge.'}</p><button onClick={e => { e.stopPropagation(); analyze(article); }}>Analyze story <ArrowUpRight size={14}/></button></div></article>)}</div>{articles.length > 1 && <div className="feed-note">Showing {articles.length} real stories returned by your connected news sources.</div>}</section>
    </>}
  </div>;
};
