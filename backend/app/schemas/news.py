from datetime import datetime
from pydantic import BaseModel, Field

class NewsSourceResponse(BaseModel):
    id: int
    code: str
    name: str
    homepage_url: str
    feed_url: str | None = None
    category: str
    status: str
    requires_auth: bool = False
    description: str | None = None
    last_fetched_at: datetime | None = None

    class Config:
        from_attributes = True

class ArticleBase(BaseModel):
    url: str
    title: str
    source_code: str
    publisher: str
    author: str | None = None
    published_at: datetime | None = None
    description: str | None = None
    full_text: str | None = None
    word_count: int = 0
    is_accessible: bool = True
    thumbnail_url: str | None = None
    category: str = "General"

class ArticleResponse(ArticleBase):
    id: int
    canonical_url: str | None = None
    retrieved_at: datetime
    is_analyzed: bool = False
    analysis_id: int | None = None

    class Config:
        from_attributes = True

class NewsSearchQuery(BaseModel):
    q: str | None = None
    source: str | None = None
    category: str | None = None
    from_date: str | None = None
    to_date: str | None = None
    limit: int = Field(default=30, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class DirectUrlRequest(BaseModel):
    url: str

class DirectTextRequest(BaseModel):
    title: str
    text: str
    source_name: str = "Direct User Submission"
    category: str = "General"
    published_date: str | None = None
    url: str | None = None
