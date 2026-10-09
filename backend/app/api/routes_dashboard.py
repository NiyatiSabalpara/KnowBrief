from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import Article, ArticleAnalysis, Entity, ExtractedEvent, KnowledgeTriple, NewsSource
from app.services.news_service import NewsService

router = APIRouter()

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes real analytics and dashboard metrics from actual stored database records.
    """
    NewsService.ensure_sources_initialized(db)

    total_articles = db.query(Article).count()
    total_analyzed = db.query(ArticleAnalysis).count()
    total_sources = db.query(NewsSource).count()
    total_triples = db.query(KnowledgeTriple).count()
    total_entities = db.query(Entity).count()
    total_events = db.query(ExtractedEvent).count()

    # Articles analyzed by publisher
    articles_by_publisher_query = db.query(Article.publisher, func.count(Article.id)).group_by(Article.publisher).all()
    articles_by_source = [{"source": pub, "count": cnt} for pub, cnt in articles_by_publisher_query]

    # Topic distribution
    topic_query = db.query(ArticleAnalysis.topic, func.count(ArticleAnalysis.id)).group_by(ArticleAnalysis.topic).all()
    topic_dist = [{"topic": top or "General", "count": cnt} for top, cnt in topic_query]

    # Top Entities
    top_entities_query = db.query(Entity.text, Entity.label, func.sum(Entity.frequency).label("total_freq")).group_by(Entity.text, Entity.label).order_by(func.sum(Entity.frequency).desc()).limit(10).all()
    top_entities = [{"name": text, "type": label, "count": int(total_freq)} for text, label, total_freq in top_entities_query]

    # Recent Analyzed Articles
    recent_analyses = db.query(ArticleAnalysis).order_by(ArticleAnalysis.id.desc()).limit(6).all()
    recent_articles = []
    for a in recent_analyses:
        art = a.article
        if art:
            recent_articles.append({
                "id": art.id,
                "analysis_id": a.id,
                "title": art.title,
                "publisher": art.publisher,
                "topic": a.topic,
                "published_at": art.published_at,
                "created_at": a.created_at,
                "word_count": art.word_count,
                "tokens_count": a.tokens_count,
                "execution_time_ms": a.execution_time_ms
            })

    # Event category breakdown
    event_query = db.query(ExtractedEvent.event_type, func.count(ExtractedEvent.id)).group_by(ExtractedEvent.event_type).all()
    event_dist = [{"type": ev_type, "count": cnt} for ev_type, cnt in event_query]

    return {
        "summary": {
            "total_articles": total_articles,
            "total_analyzed": total_analyzed,
            "total_sources": total_sources,
            "total_triples": total_triples,
            "total_entities": total_entities,
            "total_events": total_events
        },
        "articles_by_source": articles_by_source,
        "topic_distribution": topic_dist,
        "top_entities": top_entities,
        "recent_articles": recent_articles,
        "event_distribution": event_dist
    }
