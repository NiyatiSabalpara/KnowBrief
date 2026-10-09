import logging
import time
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.models import Article, ArticleAnalysis, Entity, ExtractedEvent, Relationship, KnowledgeTriple, ProcessingRun
from app.news_sources.manager import news_manager
from app.nlp.pipeline import NLPPipeline
from app.nlp.knowledge_graph import KnowledgeGraphBuilder

logger = logging.getLogger(__name__)

class AnalysisService:
    @staticmethod
    async def analyze_article(db: Session, article_id: int, force_recompute: bool = False) -> Dict[str, Any]:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            raise ValueError(f"Article with ID {article_id} not found.")

        # Check existing cached analysis if not forced
        if not force_recompute:
            cached_analysis = db.query(ArticleAnalysis).filter(ArticleAnalysis.article_id == article.id).order_by(ArticleAnalysis.id.desc()).first()
            if cached_analysis:
                return AnalysisService.format_analysis_response(db, article, cached_analysis)

        # Ensure we have full article text
        if not article.full_text or len(article.full_text.strip()) < 50:
            text, is_acc, notice = await news_manager.get_article_text(article.source_code, article.url)
            if text and len(text.strip()) > 50:
                article.full_text = text
                article.word_count = len(text.split())
                article.is_accessible = is_acc
                db.commit()
            elif article.description and len(article.description.strip()) > 50:
                # Use description as fallback snippet
                article.full_text = article.description
                article.word_count = len(article.description.split())
                db.commit()
            else:
                raise ValueError("Article full text is not accessible. Please use the 'Paste Article Text' feature to analyze.")

        # Run End-to-End NLP Pipeline
        raw_result = NLPPipeline.run_pipeline(
            text=article.full_text,
            title=article.title,
            article_url=article.url
        )

        # Persist ArticleAnalysis record
        analysis = ArticleAnalysis(
            article_id=article.id,
            summary_short=raw_result["summaries"]["short"],
            summary_medium=raw_result["summaries"]["medium"],
            summary_detailed=raw_result["summaries"]["detailed"],
            summary_abstractive=raw_result["summaries"].get("abstractive"),
            topic=raw_result["topic"]["primary_topic"],
            topic_confidence=raw_result["topic"]["confidence"],
            topic_distribution=raw_result["topic"]["all_scores"],
            keywords_tfidf=raw_result["keywords"]["tfidf"],
            keywords_textrank=raw_result["keywords"]["textrank"],
            keywords_keybert=raw_result["keywords"]["semantic_keybert"],
            coreference_chains=raw_result["coreference"],
            financial_data=raw_result["financial"],
            tokens_count=raw_result["preprocessing"]["token_count"],
            sentences_count=raw_result["preprocessing"]["sentence_count"],
            execution_time_ms=raw_result["execution_time_ms"]
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # Persist Entities
        for ent in raw_result["entities"]:
            db_ent = Entity(
                analysis_id=analysis.id,
                text=ent["text"],
                label=ent["label"],
                frequency=ent.get("frequency", 1),
                context_sentence=ent.get("context_sentence", "")
            )
            db.add(db_ent)

        # Persist Events
        for ev in raw_result["events"]:
            db_ev = ExtractedEvent(
                analysis_id=analysis.id,
                event_type=ev["event_type"],
                actor_acquirer=ev.get("actor_acquirer"),
                target_object=ev.get("target_object"),
                action=ev["action"],
                event_date=ev.get("event_date"),
                location=ev.get("location"),
                financial_value=ev.get("financial_value"),
                supporting_sentence=ev["supporting_sentence"],
                confidence=ev.get("confidence", 0.85)
            )
            db.add(db_ev)

        # Persist Relationships
        for rel in raw_result["relationships"]:
            db_rel = Relationship(
                analysis_id=analysis.id,
                subject=rel["subject"],
                predicate=rel["predicate"],
                object=rel["object"],
                evidence_sentence=rel["evidence_sentence"],
                extraction_method=rel.get("extraction_method", "Syntactic Dependency"),
                confidence=rel.get("confidence", 0.85)
            )
            db.add(db_rel)

        # Persist Knowledge Triples
        for trip in raw_result["triples"]:
            db_trip = KnowledgeTriple(
                analysis_id=analysis.id,
                subject=trip["subject"],
                predicate=trip["predicate"],
                object=trip["object"],
                subject_type=trip.get("subject_type", "ENTITY"),
                object_type=trip.get("object_type", "ENTITY"),
                supporting_sentence=trip["supporting_sentence"],
                source_url=trip.get("source_url") or article.url,
                confidence=trip.get("confidence", 0.85)
            )
            db.add(db_trip)

        # Persist Pipeline Stage Runs
        for run in raw_result["pipeline_runs"]:
            db_run = ProcessingRun(
                article_id=article.id,
                stage_name=run["stage_name"],
                status=run["status"],
                execution_time_ms=run["execution_time_ms"],
                output_sample=run.get("output_preview"),
                error_message=run.get("error_message")
            )
            db.add(db_run)

        db.commit()

        return AnalysisService.format_analysis_response(db, article, analysis, raw_result.get("preprocessing"), raw_result.get("pipeline_runs"))

    @staticmethod
    def format_analysis_response(
        db: Session,
        article: Article,
        analysis: ArticleAnalysis,
        preprocessing_data: Optional[Dict[str, Any]] = None,
        pipeline_runs_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        # Fetch entities, events, relationships, triples
        entities = db.query(Entity).filter(Entity.analysis_id == analysis.id).all()
        events = db.query(ExtractedEvent).filter(ExtractedEvent.analysis_id == analysis.id).all()
        relationships = db.query(Relationship).filter(Relationship.analysis_id == analysis.id).all()
        triples = db.query(KnowledgeTriple).filter(KnowledgeTriple.analysis_id == analysis.id).all()
        runs = db.query(ProcessingRun).filter(ProcessingRun.article_id == article.id).all()

        entity_items = [{
            "id": e.id,
            "text": e.text,
            "label": e.label,
            "frequency": e.frequency,
            "context_sentence": e.context_sentence
        } for e in entities]

        event_items = [{
            "id": ev.id,
            "event_type": ev.event_type,
            "actor_acquirer": ev.actor_acquirer,
            "target_object": ev.target_object,
            "action": ev.action,
            "event_date": ev.event_date,
            "location": ev.location,
            "financial_value": ev.financial_value,
            "supporting_sentence": ev.supporting_sentence,
            "confidence": ev.confidence
        } for ev in events]

        relationship_items = [{
            "id": r.id,
            "subject": r.subject,
            "predicate": r.predicate,
            "object": r.object,
            "evidence_sentence": r.evidence_sentence,
            "extraction_method": r.extraction_method,
            "confidence": r.confidence
        } for r in relationships]

        triple_items = [{
            "id": t.id,
            "subject": t.subject,
            "predicate": t.predicate,
            "object": t.object,
            "subject_type": t.subject_type,
            "object_type": t.object_type,
            "supporting_sentence": t.supporting_sentence,
            "source_url": t.source_url,
            "confidence": t.confidence
        } for t in triples]

        # Entity distribution
        entity_dist = {}
        for e in entities:
            entity_dist[e.label] = entity_dist.get(e.label, 0) + e.frequency

        # Build Graph Data
        graph_data = KnowledgeGraphBuilder.build_graph(triple_items, entity_items, article_url=article.url)

        # Stage Runs
        stage_runs = []
        if pipeline_runs_data:
            stage_runs = pipeline_runs_data
        elif runs:
            stage_runs = [{
                "stage_name": r.stage_name,
                "status": r.status,
                "execution_time_ms": r.execution_time_ms,
                "output_preview": r.output_sample,
                "error_message": r.error_message
            } for r in runs]

        # Preprocessing Data fallback
        prep = preprocessing_data or {
            "original_char_count": len(article.full_text or ""),
            "cleaned_char_count": len(article.full_text or ""),
            "sentence_count": analysis.sentences_count,
            "token_count": analysis.tokens_count,
            "sample_tokens": [],
            "sample_sentences": (article.full_text or "").split(".")[:8]
        }

        return {
            "id": analysis.id,
            "article_id": article.id,
            "article_title": article.title,
            "article_url": article.url,
            "publisher": article.publisher,
            "published_at": article.published_at,
            "word_count": article.word_count,
            "preprocessing": prep,
            "summaries": {
                "short": analysis.summary_short or "",
                "medium": analysis.summary_medium or "",
                "detailed": analysis.summary_detailed or "",
                "abstractive": analysis.summary_abstractive,
                "method": "TextRank Graph Centrality & Lexical Salience"
            },
            "entities": entity_items,
            "entity_distribution": entity_dist,
            "keywords": {
                "tfidf": analysis.keywords_tfidf or [],
                "textrank": analysis.keywords_textrank or [],
                "semantic_keybert": analysis.keywords_keybert or []
            },
            "topic": {
                "primary_topic": analysis.topic or "General",
                "confidence": analysis.topic_confidence or 0.0,
                "all_scores": analysis.topic_distribution or {},
                "topic_phrases": [],
                "method": "Domain Vector Cosine Taxonomy Classifier"
            },
            "events": event_items,
            "relationships": relationship_items,
            "coreference": analysis.coreference_chains or [],
            "triples": triple_items,
            "financial": analysis.financial_data or {"is_financial": False, "summary": "No financial metrics found.", "tickers": [], "numerical_claims": []},
            "graph": graph_data,
            "pipeline_runs": stage_runs,
            "execution_time_ms": analysis.execution_time_ms,
            "created_at": analysis.created_at
        }
