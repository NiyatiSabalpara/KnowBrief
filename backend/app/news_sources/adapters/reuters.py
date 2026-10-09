import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class ReutersAdapter(BaseNewsAdapter):
    """
    Reuters news adapter. Note: Reuters has restricted public RSS access in recent years,
    so we query reliable public wire feeds, agency summaries, and respect their access policy.
    """
    FEEDS = {
        "General": "https://www.reutersagency.com/feed/?best-regions=north-america&post_type=best",
        "Business": "https://www.reutersagency.com/feed/?taxonomy=markets&post_type=best",
        "Technology": "https://www.reutersagency.com/feed/?best-sectors=technology&post_type=best",
    }

    def __init__(self):
        super().__init__(
            code="reuters",
            name="Reuters",
            homepage_url="https://www.reuters.com",
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
                        author="Reuters Wire",
                        thumbnail_url=thumb,
                        category=category or "International Affairs",
                        is_accessible=True,
                        metadata={"notice": "Reuters agency feed. For subscription stories, use manual pasting if needed."}
                    )
                )
            self.status = "Available" if articles else "Limited Access"
        except Exception as e:
            logger.error(f"Reuters feed error: {e}")
            self.status = "Limited Access"
            self.last_error = str(e)

        return articles

    async def fetch_article_text(self, url: str) -> tuple[Optional[str], bool, Optional[str]]:
        html, error = await ArticleExtractor.fetch_url_content(url)
        if error:
            return None, False, error
            
        extracted = ArticleExtractor.extract_from_html(html, url=url)
        text = extracted.get("text", "")
        if not text or len(text.strip()) < 100:
            return None, False, "Reuters article content requires direct subscription or manual paste."
            
        return text, True, None
