from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Article, ArticleAnalysis
from app.schemas.analysis import CrossArticleComparisonRequest
from app.services.analysis_service import AnalysisService
from app.nlp.cross_article import CrossArticleExplorer

router = APIRouter()

@router.post("/articles/compare")
def compare_articles(req: CrossArticleComparisonRequest, db: Session = Depends(get_db)):
    """
    Cross-Article Knowledge Explorer endpoint:
    Compares 2 or more articles, computes entity overlap, keyword overlap,
    semantic similarity matrix, timeline of events, synthesized summary,
    discrepancy detection, and combined knowledge graph.
    """
    if not req.article_ids or len(req.article_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 articles for cross-article comparison.")

    analyzed_data = []

    for art_id in req.article_ids:
        art = db.query(Article).filter(Article.id == art_id).first()
        if not art:
            continue
        analysis = db.query(ArticleAnalysis).filter(ArticleAnalysis.article_id == art_id).order_by(ArticleAnalysis.id.desc()).first()
        if not analysis:
            continue

        resp = AnalysisService.format_analysis_response(db, art, analysis)
        analyzed_data.append({
            "id": art.id,
            "title": art.title,
            "publisher": art.publisher,
            "url": art.url,
            "summary_medium": resp["summaries"]["medium"],
            "summary_short": resp["summaries"]["short"],
            "full_text": art.full_text,
            "entities": resp["entities"],
            "keywords": resp["keywords"],
            "events": resp["events"],
            "triples": resp["triples"]
        })

    if len(analyzed_data) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 of the selected articles must have completed NLP analysis before comparison. Please analyze them first."
        )

    comparison_results = CrossArticleExplorer.compare_articles(analyzed_data)
    return comparison_results
