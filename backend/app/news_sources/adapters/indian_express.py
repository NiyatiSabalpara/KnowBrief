import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class IndianExpressAdapter(BaseNewsAdapter):
    FEEDS = {
        "General": "https://indianexpress.com/feed/",
        "Technology": "https://indianexpress.com/section/technology/feed/",
        "Business": "https://indianexpress.com/section/business/feed/",
        "Politics": "https://indianexpress.com/section/political-pulse/feed/",
        "Sports": "https://indianexpress.com/section/sports/feed/",
    }

    def __init__(self):
        super().__init__(
            code="indian_express",
            name="The Indian Express",
            homepage_url="https://indianexpress.com",
            default_category="General"
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
                        author="Express News Service",
                        thumbnail_url=thumb,
                        category=category or "General",
                        is_accessible=True,
                        metadata={}
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"Indian Express feed error: {e}")
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
            return None, False, "Unable to extract Indian Express article text. Please paste the article text."
            
        return text, True, None
