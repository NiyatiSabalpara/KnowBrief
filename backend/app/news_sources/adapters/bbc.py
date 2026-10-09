import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class BBCNewsAdapter(BaseNewsAdapter):
    FEEDS = {
        "General": "http://feeds.bbci.co.uk/news/rss.xml",
        "Business": "http://feeds.bbci.co.uk/news/business/rss.xml",
        "Technology": "http://feeds.bbci.co.uk/news/technology/rss.xml",
        "Science": "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
        "Healthcare": "http://feeds.bbci.co.uk/news/health/rss.xml",
        "Environment": "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
        "International Affairs": "http://feeds.bbci.co.uk/news/world/rss.xml",
    }

    def __init__(self):
        super().__init__(
            code="bbc",
            name="BBC News",
            homepage_url="https://www.bbc.com/news",
            default_category="International Affairs"
        )

    async def fetch_latest(self, category: Optional[str] = None, limit: int = 20) -> List[RawArticle]:
        feed_url = self.FEEDS.get(category or "", self.FEEDS["General"])
        articles = []
        try:
            feed = await fetch_feed(feed_url)
            for entry in feed.entries[:limit]:
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6])

                desc = entry.get("summary", "") or entry.get("description", "")
                
                thumb = None
                if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                    thumb = entry.media_thumbnail[0].get("url")

                articles.append(
                    RawArticle(
                        url=entry.get("link", ""),
                        title=entry.get("title", ""),
                        source_code=self.code,
                        publisher=self.name,
                        published_at=pub_date or datetime.utcnow(),
                        description=desc,
                        full_text=None,
                        author="BBC News",
                        thumbnail_url=thumb,
                        category=category or "International Affairs",
                        is_accessible=True,
                        metadata={}
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"BBC feed error: {e}")
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
            return None, False, "Unable to extract BBC article text automatically. Please paste the article text."
            
        return text, True, None
