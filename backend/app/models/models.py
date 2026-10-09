import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    homepage_url = Column(String(255), nullable=False)
    feed_url = Column(String(255), nullable=True)
    category = Column(String(50), default="General")
    status = Column(String(50), default="Available")  # Available, Limited Access, Temporarily Unavailable
    requires_auth = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    last_fetched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), unique=True, index=True, nullable=False)
    canonical_url = Column(String(500), index=True, nullable=True)
    title = Column(String(500), nullable=False)
    normalized_title = Column(String(500), index=True, nullable=True)
    source_code = Column(String(50), index=True, nullable=False)
    publisher = Column(String(100), nullable=False)
    author = Column(String(200), nullable=True)
    published_at = Column(DateTime, nullable=True)
    retrieved_at = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(Text, nullable=True)
    full_text = Column(Text, nullable=True)
    word_count = Column(Integer, default=0)
    is_accessible = Column(Boolean, default=True)
    thumbnail_url = Column(String(500), nullable=True)
    category = Column(String(50), default="General")

    analyses = relationship("ArticleAnalysis", back_populates="article", cascade="all, delete-orphan")
    processing_runs = relationship("ProcessingRun", back_populates="article", cascade="all, delete-orphan")

class ArticleAnalysis(Base):
    __tablename__ = "article_analyses"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False, index=True)
    summary_short = Column(Text, nullable=True)
    summary_medium = Column(Text, nullable=True)
    summary_detailed = Column(Text, nullable=True)
    summary_abstractive = Column(Text, nullable=True)
    topic = Column(String(100), nullable=True)
    topic_confidence = Column(Float, default=0.0)
    topic_distribution = Column(JSON, nullable=True)
    keywords_tfidf = Column(JSON, nullable=True)
    keywords_textrank = Column(JSON, nullable=True)
    keywords_keybert = Column(JSON, nullable=True)
    coreference_chains = Column(JSON, nullable=True)
    financial_data = Column(JSON, nullable=True)
    tokens_count = Column(Integer, default=0)
    sentences_count = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    article = relationship("Article", back_populates="analyses")
    entities = relationship("Entity", back_populates="analysis", cascade="all, delete-orphan")
    events = relationship("ExtractedEvent", back_populates="analysis", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="analysis", cascade="all, delete-orphan")
    triples = relationship("KnowledgeTriple", back_populates="analysis", cascade="all, delete-orphan")

class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("article_analyses.id"), nullable=False, index=True)
    text = Column(String(255), nullable=False, index=True)
    label = Column(String(50), nullable=False, index=True)  # PERSON, ORG, GPE, LOC, DATE, MONEY, PRODUCT, EVENT, etc.
    frequency = Column(Integer, default=1)
    context_sentence = Column(Text, nullable=True)

    analysis = relationship("ArticleAnalysis", back_populates="entities")

class ExtractedEvent(Base):
    __tablename__ = "extracted_events"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("article_analyses.id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # Acquisition, Investment, Product Launch, Appointment, etc.
    actor_acquirer = Column(String(255), nullable=True)
    target_object = Column(String(255), nullable=True)
    action = Column(String(255), nullable=False)
    event_date = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    financial_value = Column(String(100), nullable=True)
    supporting_sentence = Column(Text, nullable=False)
    confidence = Column(Float, default=0.85)

    analysis = relationship("ArticleAnalysis", back_populates="events")

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("article_analyses.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False, index=True)
    predicate = Column(String(255), nullable=False)
    object = Column(String(255), nullable=False, index=True)
    evidence_sentence = Column(Text, nullable=False)
    extraction_method = Column(String(100), default="Dependency-Syntactic-Pattern")
    confidence = Column(Float, default=0.8)

    analysis = relationship("ArticleAnalysis", back_populates="relationships")

class KnowledgeTriple(Base):
    __tablename__ = "knowledge_triples"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("article_analyses.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False, index=True)
    predicate = Column(String(255), nullable=False)
    object = Column(String(255), nullable=False, index=True)
    subject_type = Column(String(50), default="ENTITY")
    object_type = Column(String(50), default="ENTITY")
    supporting_sentence = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)
    confidence = Column(Float, default=0.85)

    analysis = relationship("ArticleAnalysis", back_populates="triples")

class ProcessingRun(Base):
    __tablename__ = "processing_runs"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=True, index=True)
    stage_name = Column(String(100), nullable=False)
    status = Column(String(50), default="SUCCESS")  # SUCCESS, WARNING, ERROR, SKIPPED
    execution_time_ms = Column(Float, default=0.0)
    input_sample = Column(Text, nullable=True)
    output_sample = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    article = relationship("Article", back_populates="processing_runs")
