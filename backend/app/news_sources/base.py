from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
import time
from typing import List, Optional
import feedparser
import httpx

_FEED_CACHE: dict[str, tuple[float, bytes]] = {}
_FEED_CACHE_TTL_SECONDS = 300

async def fetch_feed(feed_url: str):
    """Fetch an RSS/Atom document without blocking FastAPI's event loop.

    Feed parsing used to pass the URL to feedparser directly, which performs a
    synchronous network request. When one publisher stalled, that blocked every
    other concurrent feed task and the homepage request exceeded its timeout.
    """
    cached = _FEED_CACHE.get(feed_url)
    now = time.monotonic()
    if cached and now - cached[0] < _FEED_CACHE_TTL_SECONDS:
        return feedparser.parse(cached[1])

    timeout = httpx.Timeout(8.0, connect=4.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={
        "User-Agent": "Mozilla/5.0 (compatible; NewsKnowledgeReader/1.0)"
    }) as client:
        response = await client.get(feed_url)
        response.raise_for_status()
        content = response.content

    _FEED_CACHE[feed_url] = (time.monotonic(), content)
    if len(_FEED_CACHE) > 128:
        oldest = min(_FEED_CACHE, key=lambda key: _FEED_CACHE[key][0])
        _FEED_CACHE.pop(oldest, None)
    return feedparser.parse(content)

@dataclass
class RawArticle:
    url: str
    title: str
    source_code: str
    publisher: str
    published_at: Optional[datetime] = None
    description: Optional[str] = None
    full_text: Optional[str] = None
    author: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: str = "General"
    is_accessible: bool = True
    metadata: dict = field(default_factory=dict)

class BaseNewsAdapter(ABC):
    def __init__(self, code: str, name: str, homepage_url: str, default_category: str = "General"):
        self.code = code
        self.name = name
        self.homepage_url = homepage_url
        self.default_category = default_category
        self.status = "Available"
        self.last_error = None

    @abstractmethod
    async def fetch_latest(self, category: Optional[str] = None, limit: int = 20) -> List[RawArticle]:
        """Fetch latest news articles from this source."""
        pass

    @abstractmethod
    async def fetch_article_text(self, url: str) -> tuple[Optional[str], bool, Optional[str]]:
        """
        Fetch full article text from URL.
        Returns: (full_text, is_accessible, error_or_notice)
        """
        pass
