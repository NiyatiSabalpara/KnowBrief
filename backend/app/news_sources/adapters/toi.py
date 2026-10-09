import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class TimesOfIndiaAdapter(BaseNewsAdapter):
    FEEDS = {
        "General": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "Business": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
        "Technology": "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
        "Sports": "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
        "Science": "https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms",
        "Environment": "https://timesofindia.indiatimes.com/rssfeeds/2647163.cms",
        "International Affairs": "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    }

    def __init__(self):
        super().__init__(
            code="toi",
            name="The Times of India",
            homepage_url="https://timesofindia.indiatimes.com",
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
                if hasattr(entry, "enclosures") and entry.enclosures:
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
                        author="Times of India Bureau",
                        thumbnail_url=thumb,
                        category=category or "General",
                        is_accessible=True,
                        metadata={}
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"TOI feed error: {e}")
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
            return None, False, "Article content could not be extracted automatically. Please paste the article text."
            
        return text, True, None
