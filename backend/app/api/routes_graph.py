from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Article, ArticleAnalysis, KnowledgeTriple, Entity
from app.nlp.knowledge_graph import KnowledgeGraphBuilder

router = APIRouter()

@router.get("/articles/{article_id}/graph")
def get_article_graph(article_id: int, db: Session = Depends(get_db)):
    """Retrieves knowledge graph nodes and edges for a specific article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")

    analysis = db.query(ArticleAnalysis).filter(ArticleAnalysis.article_id == article.id).order_by(ArticleAnalysis.id.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found for this article.")

    triples = db.query(KnowledgeTriple).filter(KnowledgeTriple.analysis_id == analysis.id).all()
    entities = db.query(Entity).filter(Entity.analysis_id == analysis.id).all()

    triple_items = [{
        "subject": t.subject,
        "predicate": t.predicate,
        "object": t.object,
        "subject_type": t.subject_type,
        "object_type": t.object_type,
        "supporting_sentence": t.supporting_sentence,
        "source_url": t.source_url or article.url,
        "confidence": t.confidence
    } for t in triples]

    entity_items = [{
        "text": e.text,
        "label": e.label,
        "frequency": e.frequency
    } for e in entities]

    graph = KnowledgeGraphBuilder.build_graph(triple_items, entity_items, article_url=article.url)
    return graph

@router.get("/graph/global")
def get_global_graph(
    limit: int = Query(200, ge=10, le=1000),
    entity_type: str | None = Query(None, description="Filter by entity type, e.g. ORGANIZATION, PERSON, GPE"),
    db: Session = Depends(get_db)
):
    """
    Constructs the global multi-article knowledge graph by aggregating
    all knowledge triples and entities across all analyzed articles in the database.
    """
    triples = db.query(KnowledgeTriple).order_by(KnowledgeTriple.id.desc()).limit(limit).all()
    entities = db.query(Entity).order_by(Entity.frequency.desc()).limit(limit).all()

    triple_items = [{
        "subject": t.subject,
        "predicate": t.predicate,
        "object": t.object,
        "subject_type": t.subject_type,
        "object_type": t.object_type,
        "supporting_sentence": t.supporting_sentence,
        "source_url": t.source_url,
        "confidence": t.confidence
    } for t in triples]

    entity_items = [{
        "text": e.text,
        "label": e.label,
        "frequency": e.frequency
    } for e in entities]

    if entity_type and entity_type.upper() != "ALL":
        triple_items = [
            t for t in triple_items
            if entity_type.upper() in t.get("subject_type", "").upper() or entity_type.upper() in t.get("object_type", "").upper()
        ]

    graph = KnowledgeGraphBuilder.build_graph(triple_items, entity_items)
    return graph
