import logging
import time
from typing import Dict, Any, List
from app.nlp.preprocessing import TextPreprocessor
from app.nlp.ner import NamedEntityRecognizer
from app.nlp.keywords import KeywordExtractor
from app.nlp.topic_classifier import topic_classifier
from app.nlp.summarizer import TextRankSummarizer
from app.nlp.event_extraction import EventExtractor
from app.nlp.relation_extraction import RelationExtractor
from app.nlp.coreference import CoreferenceResolver
from app.nlp.financial_analyzer import FinancialAnalyzer
from app.nlp.knowledge_graph import KnowledgeGraphBuilder

logger = logging.getLogger(__name__)

class NLPPipeline:
    """
    End-to-End Modular NLP Processing Pipeline:
    Executes each stage, records execution times and status runs for academic inspection,
    and returns a structured knowledge object.
    """

    @classmethod
    def run_pipeline(cls, text: str, title: str = "", article_url: str = "") -> Dict[str, Any]:
        pipeline_start = time.perf_counter()
        pipeline_runs = []

        # Stage 1: Preprocessing
        s1_start = time.perf_counter()
        try:
            prep_data = TextPreprocessor.process(text)
            s1_ms = (time.perf_counter() - s1_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "1. Text Preprocessing & POS Tagging",
                "status": "SUCCESS",
                "execution_time_ms": round(s1_ms, 2),
                "output_preview": f"{prep_data['sentence_count']} sentences, {prep_data['token_count']} tokens extracted."
            })
        except Exception as e:
            prep_data = {"sentences": [text], "sample_tokens": [], "original_char_count": len(text), "cleaned_char_count": len(text), "sentence_count": 1, "token_count": len(text.split()), "sample_sentences": [text]}
            pipeline_runs.append({
                "stage_name": "1. Text Preprocessing & POS Tagging",
                "status": "WARNING",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        cleaned_text = prep_data.get("cleaned_text") or text
        sentences = prep_data.get("sentences", [])

        # Stage 2: Named Entity Recognition
        s2_start = time.perf_counter()
        try:
            ner_data = NamedEntityRecognizer.extract_entities(cleaned_text, sentences=sentences)
            s2_ms = (time.perf_counter() - s2_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "2. Named Entity Recognition (NER)",
                "status": "SUCCESS",
                "execution_time_ms": round(s2_ms, 2),
                "output_preview": f"Identified {len(ner_data['entities'])} unique named entities across {len(ner_data['distribution'])} categories."
            })
        except Exception as e:
            ner_data = {"entities": [], "distribution": {}}
            pipeline_runs.append({
                "stage_name": "2. Named Entity Recognition (NER)",
                "status": "ERROR",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 3: Keyword Extraction
        s3_start = time.perf_counter()
        try:
            kw_data = KeywordExtractor.extract_all(cleaned_text)
            s3_ms = (time.perf_counter() - s3_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "3. Keyword & Keyphrase Extraction",
                "status": "SUCCESS",
                "execution_time_ms": round(s3_ms, 2),
                "output_preview": f"Extracted {len(kw_data['tfidf'])} TF-IDF, {len(kw_data['textrank'])} TextRank, and {len(kw_data['semantic_keybert'])} Semantic KeyBERT terms."
            })
        except Exception as e:
            kw_data = {"tfidf": [], "textrank": [], "semantic_keybert": []}
            pipeline_runs.append({
                "stage_name": "3. Keyword & Keyphrase Extraction",
                "status": "ERROR",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 4: Topic Classification
        s4_start = time.perf_counter()
        try:
            topic_data = topic_classifier.classify(f"{title} {cleaned_text}")
            s4_ms = (time.perf_counter() - s4_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "4. Topic Classification",
                "status": "SUCCESS",
                "execution_time_ms": round(s4_ms, 2),
                "output_preview": f"Classified as '{topic_data['primary_topic']}' with {int(topic_data['confidence']*100)}% confidence."
            })
        except Exception as e:
            topic_data = {"primary_topic": "General", "confidence": 0.5, "all_scores": {}, "topic_phrases": [], "method": "Fallback"}
            pipeline_runs.append({
                "stage_name": "4. Topic Classification",
                "status": "WARNING",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 5: Summarization
        s5_start = time.perf_counter()
        try:
            summary_data = TextRankSummarizer.summarize(cleaned_text, sentences=sentences)
            s5_ms = (time.perf_counter() - s5_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "5. Graph-Based Summarization",
                "status": "SUCCESS",
                "execution_time_ms": round(s5_ms, 2),
                "output_preview": "Generated Short, Medium, and Detailed extractive summaries."
            })
        except Exception as e:
            summary_data = {"short": cleaned_text[:200], "medium": cleaned_text[:400], "detailed": cleaned_text[:700], "abstractive": None}
            pipeline_runs.append({
                "stage_name": "5. Graph-Based Summarization",
                "status": "WARNING",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 6: Event Extraction
        s6_start = time.perf_counter()
        try:
            event_data = EventExtractor.extract_events(cleaned_text)
            s6_ms = (time.perf_counter() - s6_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "6. Structured Event Extraction",
                "status": "SUCCESS",
                "execution_time_ms": round(s6_ms, 2),
                "output_preview": f"Discovered {len(event_data['events'])} structured events."
            })
        except Exception as e:
            event_data = {"events": []}
            pipeline_runs.append({
                "stage_name": "6. Structured Event Extraction",
                "status": "ERROR",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 7: Relationship Extraction
        s7_start = time.perf_counter()
        try:
            rel_data = RelationExtractor.extract_relations(cleaned_text)
            s7_ms = (time.perf_counter() - s7_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "7. Syntactic Relationship Extraction",
                "status": "SUCCESS",
                "execution_time_ms": round(s7_ms, 2),
                "output_preview": f"Extracted {len(rel_data['relationships'])} entity relation pairs."
            })
        except Exception as e:
            rel_data = {"relationships": []}
            pipeline_runs.append({
                "stage_name": "7. Syntactic Relationship Extraction",
                "status": "ERROR",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 8: Coreference Resolution
        s8_start = time.perf_counter()
        try:
            coref_data = CoreferenceResolver.resolve(cleaned_text)
            s8_ms = (time.perf_counter() - s8_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "8. Anaphora & Coreference Resolution",
                "status": "SUCCESS",
                "execution_time_ms": round(s8_ms, 2),
                "output_preview": f"Resolved {len(coref_data['chains'])} coreference mention chains."
            })
        except Exception as e:
            coref_data = {"chains": []}
            pipeline_runs.append({
                "stage_name": "8. Anaphora & Coreference Resolution",
                "status": "WARNING",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 9: Knowledge Triples Construction
        triples = []
        # From relationships
        for rel in rel_data.get("relationships", []):
            triples.append({
                "subject": rel["subject"],
                "predicate": rel["predicate"],
                "object": rel["object"],
                "subject_type": "ENTITY",
                "object_type": "ENTITY",
                "supporting_sentence": rel["evidence_sentence"],
                "source_url": article_url,
                "confidence": rel.get("confidence", 0.85)
            })
        # From structured events
        for ev in event_data.get("events", []):
            if ev.get("actor_acquirer") and ev.get("target_object"):
                triples.append({
                    "subject": ev["actor_acquirer"],
                    "predicate": ev["action"],
                    "object": ev["target_object"],
                    "subject_type": "ORGANIZATION / ACTOR",
                    "object_type": "TARGET / VALUE",
                    "supporting_sentence": ev["supporting_sentence"],
                    "source_url": article_url,
                    "confidence": ev.get("confidence", 0.88)
                })

        # Stage 10: Knowledge Graph Generation
        s10_start = time.perf_counter()
        try:
            graph_data = KnowledgeGraphBuilder.build_graph(triples, ner_data.get("entities", []), article_url=article_url)
            s10_ms = (time.perf_counter() - s10_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "9. NetworkX Knowledge Graph Generation",
                "status": "SUCCESS",
                "execution_time_ms": round(s10_ms, 2),
                "output_preview": f"Constructed graph with {graph_data['stats']['total_nodes']} nodes and {graph_data['stats']['total_edges']} edges."
            })
        except Exception as e:
            graph_data = {"nodes": [], "edges": [], "stats": {}}
            pipeline_runs.append({
                "stage_name": "9. NetworkX Knowledge Graph Generation",
                "status": "ERROR",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        # Stage 11: Financial Analysis
        s11_start = time.perf_counter()
        try:
            financial_data = FinancialAnalyzer.analyze(cleaned_text)
            s11_ms = (time.perf_counter() - s11_start) * 1000.0
            pipeline_runs.append({
                "stage_name": "10. Financial & Business Analytics Mode",
                "status": "SUCCESS",
                "execution_time_ms": round(s11_ms, 2),
                "output_preview": financial_data["summary"]
            })
        except Exception as e:
            financial_data = {"is_financial": False, "summary": "Error in financial analysis", "tickers": [], "numerical_claims": []}
            pipeline_runs.append({
                "stage_name": "10. Financial & Business Analytics Mode",
                "status": "WARNING",
                "execution_time_ms": 0.0,
                "error_message": str(e)
            })

        total_elapsed_ms = (time.perf_counter() - pipeline_start) * 1000.0

        return {
            "preprocessing": prep_data,
            "entities": ner_data.get("entities", []),
            "entity_distribution": ner_data.get("distribution", {}),
            "keywords": kw_data,
            "topic": topic_data,
            "summaries": summary_data,
            "events": event_data.get("events", []),
            "relationships": rel_data.get("relationships", []),
            "coreference": coref_data.get("chains", []),
            "triples": triples,
            "financial": financial_data,
            "graph": graph_data,
            "pipeline_runs": pipeline_runs,
            "execution_time_ms": round(total_elapsed_ms, 2)
        }
