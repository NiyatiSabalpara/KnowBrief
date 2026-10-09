import logging
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import NewsSource, Article, ArticleAnalysis
from app.news_sources.manager import news_manager
from app.news_sources.extractor import ArticleExtractor
from app.schemas.news import DirectTextRequest

logger = logging.getLogger(__name__)

class NewsService:
    @staticmethod
    def ensure_sources_initialized(db: Session):
        """Pre-populates database with official source profiles if not present."""
        sources_info = news_manager.get_sources_info()
        for src in sources_info:
            existing = db.query(NewsSource).filter(NewsSource.code == src["code"]).first()
            if not existing:
                new_src = NewsSource(
                    code=src["code"],
                    name=src["name"],
                    homepage_url=src["homepage_url"],
                    feed_url=None,
                    category=src["default_category"],
                    status=src["status"],
                    requires_auth=src["requires_auth"],
                    description=f"Official news feed from {src['name']}."
                )
                db.add(new_src)
        db.commit()

    @staticmethod
    async def search_and_sync_news(
        db: Session,
        query: Optional[str] = None,
        source_codes: Optional[List[str]] = None,
        category: Optional[str] = None,
        limit: int = 30
    ) -> List[dict]:
        """
        Fetches live articles from configured news publishers,
        stores/updates records in the database, and returns combined results with analysis status.
        """
        NewsService.ensure_sources_initialized(db)

        raw_articles = await news_manager.search_news(
            query=query,
            source_codes=source_codes,
            category=category,
            limit=limit
        )

        response_items = []

        for raw in raw_articles:
            norm_title = news_manager.normalize_title(raw.title)
            norm_url = news_manager.normalize_url(raw.url)

            # Check if article already exists in database
            article = db.query(Article).filter(
                (Article.url == raw.url) | (Article.canonical_url == norm_url)
            ).first()

            if not article:
                article = Article(
                    url=raw.url,
                    canonical_url=norm_url,
                    title=raw.title,
                    normalized_title=norm_title,
                    source_code=raw.source_code,
                    publisher=raw.publisher,
                    author=raw.author,
                    published_at=raw.published_at,
                    description=raw.description,
                    thumbnail_url=raw.thumbnail_url,
                    category=raw.category,
                    is_accessible=raw.is_accessible
                )
                db.add(article)
                db.commit()
                db.refresh(article)

            # Check if analysis exists
            latest_analysis = db.query(ArticleAnalysis).filter(ArticleAnalysis.article_id == article.id).order_by(ArticleAnalysis.id.desc()).first()

            response_items.append({
                "id": article.id,
                "url": article.url,
                "canonical_url": article.canonical_url,
                "title": article.title,
                "source_code": article.source_code,
                "publisher": article.publisher,
                "author": article.author,
                "published_at": article.published_at,
                "retrieved_at": article.retrieved_at,
                "description": article.description,
                "thumbnail_url": article.thumbnail_url,
                "category": article.category,
                "is_accessible": article.is_accessible,
                "word_count": article.word_count,
                "is_analyzed": latest_analysis is not None,
                "analysis_id": latest_analysis.id if latest_analysis else None
            })

        return response_items

    @staticmethod
    async def ingest_direct_url(db: Session, url: str) -> Article:
        """Fetches page content, extracts text, and creates a database Article record."""
        norm_url = news_manager.normalize_url(url)
        existing = db.query(Article).filter(
            (Article.url == url) | (Article.canonical_url == norm_url)
        ).first()
        
        if existing and existing.full_text and len(existing.full_text.strip()) > 100:
            return existing

        html, error = await ArticleExtractor.fetch_url_content(url)
        if error:
            # Create a placeholder article if page could not be fetched
            if not existing:
                existing = Article(
                    url=url,
                    canonical_url=norm_url,
                    title="Direct Article URL",
                    source_code="custom_url",
                    publisher="Direct URL",
                    is_accessible=False,
                    description=error
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)
            return existing

        extracted = ArticleExtractor.extract_from_html(html, url=url)
        title = extracted.get("title") or "Extracted Web Article"
        text = extracted.get("text") or ""
        
        if existing:
            existing.title = title
            existing.full_text = text
            existing.word_count = len(text.split())
            existing.author = extracted.get("author") or existing.author
            existing.thumbnail_url = extracted.get("image") or existing.thumbnail_url
            existing.is_accessible = len(text.strip()) > 50
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_art = Article(
                url=url,
                canonical_url=norm_url,
                title=title,
                normalized_title=news_manager.normalize_title(title),
                source_code="custom_url",
                publisher="Web Publisher",
                author=extracted.get("author"),
                published_at=datetime.utcnow(),
                description=extracted.get("description"),
                full_text=text,
                word_count=len(text.split()),
                thumbnail_url=extracted.get("image"),
                is_accessible=len(text.strip()) > 50,
                category="General"
            )
            db.add(new_art)
            db.commit()
            db.refresh(new_art)
            return new_art

    @staticmethod
    def ingest_direct_text(db: Session, req: DirectTextRequest) -> Article:
        """Stores user-pasted article text directly."""
        import uuid
        url = req.url or f"urn:custom:article:{uuid.uuid4().hex[:12]}"
        
        new_art = Article(
            url=url,
            canonical_url=url,
            title=req.title,
            normalized_title=news_manager.normalize_title(req.title),
            source_code="user_submission",
            publisher=req.source_name,
            author="User Contributed",
            published_at=datetime.utcnow(),
            description=req.text[:250] + "..." if len(req.text) > 250 else req.text,
            full_text=req.text,
            word_count=len(req.text.split()),
            category=req.category,
            is_accessible=True
        )
        db.add(new_art)
        db.commit()
        db.refresh(new_art)
        return new_art
