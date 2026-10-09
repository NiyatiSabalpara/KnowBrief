import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class FinancialTimesAdapter(BaseNewsAdapter):
    FEEDS = {
        "General": "https://www.ft.com/rss/home",
        "Business": "https://www.ft.com/rss/companies",
        "Finance": "https://www.ft.com/rss/markets",
        "Technology": "https://www.ft.com/rss/technology",
        "International Affairs": "https://www.ft.com/rss/world",
    }

    def __init__(self):
        super().__init__(
            code="ft",
            name="Financial Times",
            homepage_url="https://www.ft.com",
            default_category="Finance"
        )

    async def fetch_latest(self, category: Optional[str] = None, limit: int = 20) -> List[RawArticle]:
        feed_url = self.FEEDS.get(category or "", self.FEEDS["General"])
        articles = []
        try:
            feed = await fetch_feed(feed_url)
            for entry in feed.entries[:limit]:
                # Extract publication date
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                    pub_date = datetime(*entry.updated_parsed[:6])

                # Get description / summary
                desc = entry.get("summary", "") or entry.get("description", "")
                
                # Check thumbnail
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
                        author=entry.get("author", "Financial Times Editorial"),
                        thumbnail_url=thumb,
                        category=category or "Finance",
                        is_accessible=True,
                        metadata={"is_paywalled": True, "notice": "Subscription source: Full text requires authorized access or manual pasting."}
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"FT feed error: {e}")
            self.status = "Temporarily Unavailable"
            self.last_error = str(e)

        return articles

    async def fetch_article_text(self, url: str) -> tuple[Optional[str], bool, Optional[str]]:
        html, error = await ArticleExtractor.fetch_url_content(url)
        if error:
            return None, False, f"Financial Times article requires subscription access. Original link is preserved. {error}"
        
        extracted = ArticleExtractor.extract_from_html(html, url=url)
        text = extracted.get("text", "")
        if not text or len(text.strip()) < 150:
            return None, False, "Financial Times paywall detected. You can paste the authorized article text in the Analysis tab."
            
        return text, True, None
