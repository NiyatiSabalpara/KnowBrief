import asyncio
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle
from app.news_sources.adapters.ft import FinancialTimesAdapter
from app.news_sources.adapters.toi import TimesOfIndiaAdapter
from app.news_sources.adapters.ht import HindustanTimesAdapter
from app.news_sources.adapters.bbc import BBCNewsAdapter
from app.news_sources.adapters.reuters import ReutersAdapter
from app.news_sources.adapters.the_hindu import TheHinduAdapter
from app.news_sources.adapters.indian_express import IndianExpressAdapter
from app.news_sources.adapters.general_rss import GeneralRssAdapter

logger = logging.getLogger(__name__)

class NewsSourceManager:
    def __init__(self):
        self.adapters: Dict[str, BaseNewsAdapter] = {}
        self._register_default_adapters()

    def _register_default_adapters(self):
        # 1. Financial Times (FT)
        self.adapters["ft"] = FinancialTimesAdapter()
        # 2. The Times of India (TOI)
        self.adapters["toi"] = TimesOfIndiaAdapter()
        # 3. Hindustan Times (HT)
        self.adapters["ht"] = HindustanTimesAdapter()
        # 4. BBC News
        self.adapters["bbc"] = BBCNewsAdapter()
        # 5. Reuters
        self.adapters["reuters"] = ReutersAdapter()
        # 6. The Hindu
        self.adapters["the_hindu"] = TheHinduAdapter()
        # 7. Indian Express
        self.adapters["indian_express"] = IndianExpressAdapter()
        # 8. Additional reputable sources (TechCrunch, NDTV, CNBC)
        self.adapters["techcrunch"] = GeneralRssAdapter(
            code="techcrunch",
            name="TechCrunch",
            homepage_url="https://techcrunch.com",
            feed_url="https://techcrunch.com/feed/",
            default_category="Technology and AI"
        )
        self.adapters["cnbc"] = GeneralRssAdapter(
            code="cnbc",
            name="CNBC Business",
            homepage_url="https://www.cnbc.com",
            feed_url="https://search.cnbc.com/rs/search/combinedserver/search.xml?partnerId=wrss01&id=100003114",
            default_category="Finance and Markets"
        )

    def get_sources_info(self) -> List[dict]:
        sources = []
        for code, adapter in self.adapters.items():
            sources.append({
                "code": adapter.code,
                "name": adapter.name,
                "homepage_url": adapter.homepage_url,
                "default_category": adapter.default_category,
                "status": adapter.status,
                "last_error": adapter.last_error,
                "requires_auth": adapter.code in ("ft", "reuters")
            })
        return sources

    @staticmethod
    def normalize_title(title: str) -> str:
        """Normalizes headline for deduplication comparison."""
        if not title:
            return ""
        clean = re.sub(r"[^a-zA-Z0-9\s]", "", title.lower())
        return " ".join(clean.split())

    @staticmethod
    def normalize_url(url: str) -> str:
        """Removes tracking query params from article URLs for deduplication."""
        if not url:
            return ""
        return url.split("?")[0].split("#")[0].rstrip("/")

    async def search_news(
        self,
        query: Optional[str] = None,
        source_codes: Optional[List[str]] = None,
        category: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        limit: int = 30
    ) -> List[RawArticle]:
        """
        Fetches articles from selected or all publisher adapters in parallel,
        deduplicates, filters, and sorts by publication date.
        """
        target_adapters = []
        if source_codes and len(source_codes) > 0:
            for sc in source_codes:
                if sc in self.adapters:
                    target_adapters.append(self.adapters[sc])
        else:
            target_adapters = list(self.adapters.values())

        # Parallel fetch across adapters
        tasks = [adapter.fetch_latest(category=category, limit=limit) for adapter in target_adapters]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_articles: List[RawArticle] = []
        for res in results:
            if isinstance(res, list):
                all_articles.extend(res)
            elif isinstance(res, Exception):
                logger.warning(f"Error fetching from adapter: {res}")

        # Deduplicate by normalized URL & normalized title
        seen_urls = set()
        seen_titles = set()
        deduped_articles: List[RawArticle] = []

        for art in all_articles:
            norm_url = self.normalize_url(art.url)
            norm_title = self.normalize_title(art.title)
            
            if norm_url in seen_urls or norm_title in seen_titles:
                continue
                
            seen_urls.add(norm_url)
            if len(norm_title) > 10:
                seen_titles.add(norm_title)
                
            deduped_articles.append(art)

        # Keyword filtering if query is specified
        if query and query.strip():
            q_terms = [t.lower() for t in query.strip().split()]
            filtered = []
            for art in deduped_articles:
                searchable = f"{art.title} {art.description or ''} {art.publisher}".lower()
                if any(t in searchable for t in q_terms):
                    filtered.append(art)
            deduped_articles = filtered

        # Category filtering if category specified
        if category and category.lower() != "all":
            deduped_articles = [
                a for a in deduped_articles
                if category.lower() in a.category.lower() or (a.description and category.lower() in a.description.lower())
            ]

        # Sort by published date descending (latest first)
        deduped_articles.sort(
            key=lambda x: x.published_at if x.published_at else datetime.min,
            reverse=True
        )

        return deduped_articles[:limit]

    async def get_article_text(self, source_code: str, url: str) -> tuple[Optional[str], bool, Optional[str]]:
        """Retrieves full text using the matching adapter or universal extractor."""
        if source_code in self.adapters:
            return await self.adapters[source_code].fetch_article_text(url)
            
        # Universal fallback
        from app.news_sources.extractor import ArticleExtractor
        html, error = await ArticleExtractor.fetch_url_content(url)
        if error:
            return None, False, error
        extracted = ArticleExtractor.extract_from_html(html, url=url)
        text = extracted.get("text", "")
        if not text or len(text.strip()) < 100:
            return None, False, "Unable to extract article text."
        return text, True, None

# Singleton instance
news_manager = NewsSourceManager()
