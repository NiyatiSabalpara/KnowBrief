import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class HindustanTimesAdapter(BaseNewsAdapter):
    FEEDS = {
        "General": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
        "Business": "https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml",
        "Technology": "https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml",
        "Science": "https://www.hindustantimes.com/feeds/rss/science/rssfeed.xml",
        "Sports": "https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml",
        "International Affairs": "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml",
    }

    def __init__(self):
        super().__init__(
            code="ht",
            name="Hindustan Times",
            homepage_url="https://www.hindustantimes.com",
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
                elif hasattr(entry, "enclosures") and entry.enclosures:
                    thumb = entry.enclosures[0].get("href")

                articles.append(
                    RawArticle(
                        url=entry.get("link", ""),
                        title=entry.get("title", ""),
                        source_code=self.code,
                        publisher=self.name,
                        published_at=pub_date or datetime.utcnow(),
                        description=desc,
                        full_text=None,
                        author="HT News Desk",
                        thumbnail_url=thumb,
                        category=category or "General",
                        is_accessible=True,
                        metadata={}
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"HT feed error: {e}")
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
            return None, False, "Unable to extract HT article text automatically. Please paste the article text."
            
        return text, True, None
