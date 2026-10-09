from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Article, NewsSource
from app.schemas.news import (
    NewsSourceResponse, ArticleResponse, DirectUrlRequest, DirectTextRequest
)
from app.services.news_service import NewsService
from app.services.analysis_service import AnalysisService
from app.news_sources.manager import news_manager

router = APIRouter()

@router.get("/sources", response_model=List[NewsSourceResponse])
def get_sources(db: Session = Depends(get_db)):
    """Returns all available and configured news publishers and their operational status."""
    NewsService.ensure_sources_initialized(db)
    sources = db.query(NewsSource).all()
    return sources

@router.get("/news/search")
async def search_news(
    q: Optional[str] = Query(None, description="Keyword search query"),
    source: Optional[str] = Query(None, description="Comma-separated publisher codes, e.g. 'ft,toi,ht,bbc'"),
    category: Optional[str] = Query(None, description="Topic category filter"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Searches and fetches live articles from reputable news publishers (Financial Times,
    Times of India, Hindustan Times, BBC, Reuters, The Hindu, Indian Express, etc.).
    """
    source_codes = [s.strip() for s in source.split(",")] if source else None
    articles = await NewsService.search_and_sync_news(
        db=db,
        query=q,
        source_codes=source_codes,
        category=category,
        limit=limit
    )
    return {"count": len(articles), "articles": articles}

@router.get("/news/article/{article_id}")
def get_article_by_id(article_id: int, db: Session = Depends(get_db)):
    """Retrieves article details by ID."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
    return article

@router.post("/articles/analyze-url")
async def analyze_direct_url(req: DirectUrlRequest, db: Session = Depends(get_db)):
    """Ingests and analyzes an article from a direct URL with SSRF protection."""
    try:
        article = await NewsService.ingest_direct_url(db, req.url)
        analysis_data = await AnalysisService.analyze_article(db, article.id)
        return analysis_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/articles/analyze-text")
async def analyze_direct_text(req: DirectTextRequest, db: Session = Depends(get_db)):
    """Ingests and analyzes user-pasted article text."""
    try:
        article = NewsService.ingest_direct_text(db, req)
        analysis_data = await AnalysisService.analyze_article(db, article.id)
        return analysis_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
