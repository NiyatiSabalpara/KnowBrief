import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class GeneralRssAdapter(BaseNewsAdapter):
    """
    Adapter for arbitrary or extra standard RSS/Atom feeds (e.g. TechCrunch, AP News, CNBC, etc.)
    """
    def __init__(self, code: str, name: str, homepage_url: str, feed_url: str, default_category: str = "General"):
        super().__init__(code=code, name=name, homepage_url=homepage_url, default_category=default_category)
        self.feed_url = feed_url

    async def fetch_latest(self, category: Optional[str] = None, limit: int = 20) -> List[RawArticle]:
        articles = []
        try:
            feed = await fetch_feed(self.feed_url)
            for entry in feed.entries[:limit]:
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6])

                desc = entry.get("summary", "") or entry.get("description", "")
                thumb = None
                if hasattr(entry, "media_content") and entry.media_content:
                    thumb = entry.media_content[0].get("url")

                articles.append(
                    RawArticle(
                        url=entry.get("link", ""),
                        title=entry.get("title", ""),
                        source_code=self.code,
                        publisher=self.name,
                        published_at=pub_date or datetime.utcnow(),
                        description=desc,
                        full_text=None,
                        author=entry.get("author", self.name),
                        thumbnail_url=thumb,
                        category=category or self.default_category,
                        is_accessible=True
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"General RSS error for {self.name}: {e}")
            self.status = "Temporarily Unavailable"
            self.last_error = str(e)

        return articles

    async def fetch_article_text(self, url: str) -> tuple[Optional[str], bool, Optional[str]]:
        html, error = await ArticleExtractor.fetch_url_content(url)
        if error:
            return None, False, error
            
        extracted = ArticleExtractor.extract_from_html(html, url=url)
        text = extracted.get("text", "")
        if not text or len(text.strip()) < 100:
            return None, False, "Unable to extract article text automatically."
            
        return text, True, None
