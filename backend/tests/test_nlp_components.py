import pytest
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
from app.nlp.pipeline import NLPPipeline

SAMPLE_TEST_TEXT = (
    "TechNova Solutions announced a major expansion on Monday in Mumbai. "
    "The technology company acquired CloudSphere for $1.5 billion to enhance its enterprise AI capabilities. "
    "Chief Executive Officer Rajesh Sharma stated that the acquisition will accelerate cloud adoption across Asia. "
    "TechNova reported quarterly revenue of $450 million, representing a 14% year-over-year increase."
)

def test_preprocessing():
    res = TextPreprocessor.process(SAMPLE_TEST_TEXT)
    assert res["sentence_count"] >= 3
    assert res["token_count"] > 20
    assert len(res["sample_tokens"]) > 0
    assert "cleaned_text" in res

def test_ner():
    res = NamedEntityRecognizer.extract_entities(SAMPLE_TEST_TEXT)
    entities = [e["text"] for e in res["entities"]]
    assert any("TechNova" in ent for ent in entities)
    assert any("Mumbai" in ent for ent in entities)
    assert "ORGANIZATION" in res["distribution"] or "ORG" in res["distribution"]

def test_keywords():
    res = KeywordExtractor.extract_all(SAMPLE_TEST_TEXT)
    assert len(res["tfidf"]) > 0
    assert len(res["textrank"]) > 0
    assert len(res["semantic_keybert"]) > 0

def test_topic_classifier():
    res = topic_classifier.classify(SAMPLE_TEST_TEXT)
    assert res["primary_topic"] in ("Business and Economy", "Technology and AI", "Finance and Markets")
    assert 0.0 <= res["confidence"] <= 1.0

def test_summarizer():
    res = TextRankSummarizer.summarize(SAMPLE_TEST_TEXT)
    assert len(res["short"]) > 20
    assert len(res["medium"]) >= len(res["short"])

def test_event_extraction():
    res = EventExtractor.extract_events(SAMPLE_TEST_TEXT)
    events = res["events"]
    assert len(events) > 0
    acq_events = [e for e in events if e["event_type"] == "Acquisition"]
    assert len(acq_events) > 0
    assert acq_events[0]["actor_acquirer"] is not None

def test_relation_extraction():
    res = RelationExtractor.extract_relations(SAMPLE_TEST_TEXT)
    assert len(res["relationships"]) > 0
    rel = res["relationships"][0]
    assert "subject" in rel and "predicate" in rel and "object" in rel

def test_coreference():
    res = CoreferenceResolver.resolve(SAMPLE_TEST_TEXT)
    assert "chains" in res

def test_financial_analyzer():
    res = FinancialAnalyzer.analyze(SAMPLE_TEST_TEXT)
    assert res["is_financial"] is True
    assert len(res["numerical_claims"]) > 0

def test_full_pipeline():
    res = NLPPipeline.run_pipeline(SAMPLE_TEST_TEXT, title="TechNova Acquisition", article_url="https://example.com/test")
    assert res["topic"]["primary_topic"] is not None
    assert len(res["triples"]) > 0
    assert len(res["pipeline_runs"]) == 10
    assert res["graph"]["stats"]["total_nodes"] > 0
