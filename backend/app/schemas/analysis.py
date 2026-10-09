from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any

class EntityItem(BaseModel):
    id: int | None = None
    text: str
    label: str
    frequency: int = 1
    context_sentence: str | None = None

class KeywordScore(BaseModel):
    keyword: str
    score: float

class KeywordResults(BaseModel):
    tfidf: list[KeywordScore] = []
    textrank: list[KeywordScore] = []
    semantic_keybert: list[KeywordScore] = []

class TopicClassificationResult(BaseModel):
    primary_topic: str
    confidence: float
    all_scores: dict[str, float] = {}
    topic_phrases: list[str] = []
    method: str = "Zero-Shot Semantic Cosine Classifier with Domain Taxonomies"

class SummariesResult(BaseModel):
    short: str
    medium: str
    detailed: str
    abstractive: str | None = None
    method: str = "TextRank Graph-Based Centrality & Lexical Salience"

class EventItem(BaseModel):
    id: int | None = None
    event_type: str
    actor_acquirer: str | None = None
    target_object: str | None = None
    action: str
    event_date: str | None = None
    location: str | None = None
    financial_value: str | None = None
    supporting_sentence: str
    confidence: float = 0.85

class RelationshipItem(BaseModel):
    id: int | None = None
    subject: str
    predicate: str
    object: str
    evidence_sentence: str
    extraction_method: str = "Syntactic Dependency Path & Verb Predicate Extraction"
    confidence: float = 0.85

class CoreferenceChainItem(BaseModel):
    representative_entity: str
    entity_type: str | None = None
    mentions: list[str] = []
    resolved_sentence_examples: list[dict[str, str]] = []

class KnowledgeTripleItem(BaseModel):
    id: int | None = None
    subject: str
    predicate: str
    object: str
    subject_type: str = "ENTITY"
    object_type: str = "ENTITY"
    supporting_sentence: str
    source_url: str | None = None
    confidence: float = 0.85

class GraphNode(BaseModel):
    id: str
    label: str
    title: str
    group: str
    size: int = 25
    color: dict[str, str] | None = None
    data: dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    from_: str = Field(..., alias="from")
    to: str
    label: str
    title: str
    arrows: str = "to"
    font: dict[str, Any] | None = None
    data: dict[str, Any] = {}

    class Config:
        populate_by_name = True

class GraphData(BaseModel):
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    stats: dict[str, int] = {}

class PreprocessingStageData(BaseModel):
    original_char_count: int
    cleaned_char_count: int
    sentence_count: int
    token_count: int
    sample_tokens: list[dict[str, str]] = []  # text, lemma, pos, tag, is_stop
    sample_sentences: list[str] = []

class FinancialMetricItem(BaseModel):
    metric_type: str
    entity: str | None = None
    raw_value: str
    normalized_value: float | None = None
    unit_currency: str | None = None
    context_sentence: str

class FinancialAnalysisResult(BaseModel):
    is_financial: bool
    summary: str
    tickers: list[str] = []
    funding_and_deals: list[dict[str, str]] = []
    numerical_claims: list[FinancialMetricItem] = []
    revenue_profits: list[dict[str, str]] = []
    market_sentiment: str = "Neutral"

class ProcessingStageRun(BaseModel):
    stage_name: str
    status: str
    execution_time_ms: float
    output_preview: str | None = None
    error_message: str | None = None

class ArticleAnalysisResponse(BaseModel):
    id: int
    article_id: int
    article_title: str
    article_url: str
    publisher: str
    published_at: datetime | None = None
    word_count: int
    
    preprocessing: PreprocessingStageData
    summaries: SummariesResult
    entities: list[EntityItem]
    entity_distribution: dict[str, int]
    keywords: KeywordResults
    topic: TopicClassificationResult
    events: list[EventItem]
    relationships: list[RelationshipItem]
    coreference: list[CoreferenceChainItem]
    triples: list[KnowledgeTripleItem]
    financial: FinancialAnalysisResult
    graph: GraphData
    pipeline_runs: list[ProcessingStageRun]
    
    execution_time_ms: float
    created_at: datetime

class CrossArticleComparisonRequest(BaseModel):
    article_ids: list[int]

class CrossArticleComparisonResponse(BaseModel):
    articles_count: int
    shared_entities: list[dict[str, Any]]
    shared_keywords: list[dict[str, Any]]
    topic_distribution: dict[str, int]
    similarity_matrix: list[list[float]]
    article_titles: list[str]
    timeline_events: list[dict[str, Any]]
    source_summaries: list[dict[str, str]]
    synthesized_summary: str
    potential_discrepancies: list[dict[str, Any]]
    combined_graph: GraphData
