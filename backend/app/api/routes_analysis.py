from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Article, ArticleAnalysis
from app.schemas.analysis import ArticleAnalysisResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/articles/analyze")
async def analyze_article(
    article_id: int = Body(..., embed=True),
    force_recompute: bool = Body(False, embed=True),
    db: Session = Depends(get_db)
):
    """
    Triggers end-to-end NLP analysis on an article (or returns cached results).
    """
    try:
        result = await AnalysisService.analyze_article(db, article_id, force_recompute=force_recompute)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@router.get("/articles/history")
def get_analysis_history(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Returns historical list of analyzed articles."""
    analyses = db.query(ArticleAnalysis).order_by(ArticleAnalysis.id.desc()).limit(limit).all()
    history = []
    for a in analyses:
        art = a.article
        if art:
            history.append({
                "analysis_id": a.id,
                "article_id": art.id,
                "title": art.title,
                "publisher": art.publisher,
                "source_code": art.source_code,
                "published_at": art.published_at,
                "topic": a.topic,
                "topic_confidence": a.topic_confidence,
                "word_count": art.word_count,
                "created_at": a.created_at,
                "summary_preview": a.summary_short or (art.description[:150] if art.description else "")
            })
    return {"count": len(history), "history": history}

@router.get("/articles/{article_id}/results")
def get_article_results(article_id: int, db: Session = Depends(get_db)):
    """Retrieves full analysis results for an article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
        
    analysis = db.query(ArticleAnalysis).filter(ArticleAnalysis.article_id == article.id).order_by(ArticleAnalysis.id.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Article has not been analyzed yet. Please run /api/articles/analyze first.")

    return AnalysisService.format_analysis_response(db, article, analysis)

@router.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    """Deletes an article and all its associated NLP analysis records."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
    db.delete(article)
    db.commit()
    return {"message": f"Article {article_id} successfully deleted."}
