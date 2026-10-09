import logging
from datetime import datetime
from typing import List, Optional
from app.news_sources.base import BaseNewsAdapter, RawArticle, fetch_feed
from app.news_sources.extractor import ArticleExtractor

logger = logging.getLogger(__name__)

class TheHinduAdapter(BaseNewsAdapter):
    FEEDS = {
        "General": "https://www.thehindu.com/news/national/feeder/default.rss",
        "Business": "https://www.thehindu.com/business/feeder/default.rss",
        "Technology": "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
        "Science": "https://www.thehindu.com/sci-tech/science/feeder/default.rss",
        "International Affairs": "https://www.thehindu.com/news/international/feeder/default.rss",
    }

    def __init__(self):
        super().__init__(
            code="the_hindu",
            name="The Hindu",
            homepage_url="https://www.thehindu.com",
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
                        author="The Hindu Bureau",
                        thumbnail_url=thumb,
                        category=category or "General",
                        is_accessible=True,
                        metadata={}
                    )
                )
            self.status = "Available"
        except Exception as e:
            logger.error(f"The Hindu feed error: {e}")
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
            return None, False, "Unable to extract The Hindu article text. Please paste the article text."
            
        return text, True, None
