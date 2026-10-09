export interface NewsSource {
  id: number;
  code: string;
  name: string;
  homepage_url: string;
  feed_url: string | null;
  category: string;
  status: 'Available' | 'Limited Access' | 'Temporarily Unavailable';
  requires_auth: boolean;
  description: string | null;
  last_fetched_at: string | null;
}

export interface NewsArticle {
  id: number;
  url: string;
  canonical_url: string | null;
  title: string;
  source_code: string;
  publisher: string;
  author: string | null;
  published_at: string | null;
  retrieved_at: string;
  description: string | null;
  full_text: string | null;
  word_count: number;
  is_accessible: boolean;
  thumbnail_url: string | null;
  category: string;
  is_analyzed: boolean;
  analysis_id: number | null;
}

export interface EntityItem {
  id?: number;
  text: string;
  label: string;
  frequency: number;
  context_sentence?: string;
}

export interface KeywordScore {
  keyword: string;
  score: number;
}

export interface KeywordResults {
  tfidf: KeywordScore[];
  textrank: KeywordScore[];
  semantic_keybert: KeywordScore[];
}

export interface TopicClassification {
  primary_topic: string;
  confidence: number;
  all_scores: Record<string, number>;
  topic_phrases: string[];
  method: string;
}

export interface SummariesResult {
  short: string;
  medium: string;
  detailed: string;
  abstractive: string | null;
  method: string;
}

export interface EventItem {
  id?: number;
  event_type: string;
  actor_acquirer: string | null;
  target_object: string | null;
  action: string;
  event_date: string | null;
  location: string | null;
  financial_value: string | null;
  supporting_sentence: string;
  confidence: number;
}

export interface RelationshipItem {
  id?: number;
  subject: string;
  predicate: string;
  object: string;
  evidence_sentence: string;
  extraction_method: string;
  confidence: number;
}

export interface CoreferenceChainItem {
  representative_entity: string;
  entity_type: string | null;
  mentions: string[];
  resolved_sentence_examples: Array<{
    original_sentence: string;
    resolved_sentence: string;
    mention: string;
  }>;
}

export interface KnowledgeTripleItem {
  id?: number;
  subject: string;
  predicate: string;
  object: string;
  subject_type: string;
  object_type: string;
  supporting_sentence: string;
  source_url: string | null;
  confidence: number;
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  group: string;
  size: number;
  color?: {
    background: string;
    border: string;
    highlight: string;
  };
  data?: {
    entity_type: string;
    name: string;
    connected_facts: string[];
  };
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  title: string;
  arrows: string;
  font?: Record<string, any>;
  data?: {
    predicate: string;
    subject: string;
    object: string;
    evidence_sentence: string;
    source_url?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    density: number;
    connected_components?: number;
  };
}

export interface PreprocessingStageData {
  original_char_count: number;
  cleaned_char_count: number;
  sentence_count: number;
  token_count: number;
  sample_tokens: Array<{
    text: string;
    lemma: string;
    pos: string;
    tag: string;
    is_stop: boolean;
  }>;
  sample_sentences: string[];
}

export interface FinancialMetricItem {
  metric_type: string;
  entity: string | null;
  raw_value: string;
  normalized_value: number | null;
  unit_currency: string | null;
  context_sentence: string;
}

export interface FinancialAnalysisResult {
  is_financial: boolean;
  summary: string;
  tickers: string[];
  funding_and_deals: Array<{ deal_value?: string; context?: string }>;
  numerical_claims: FinancialMetricItem[];
  revenue_profits: Array<{ figure?: string; context?: string }>;
  market_sentiment: string;
}

export interface ProcessingStageRun {
  stage_name: string;
  status: string;
  execution_time_ms: number;
  output_preview?: string | null;
  error_message?: string | null;
}

export interface ArticleAnalysisResponse {
  id: number;
  article_id: number;
  article_title: string;
  article_url: string;
  publisher: string;
  published_at: string | null;
  word_count: number;
  preprocessing: PreprocessingStageData;
  summaries: SummariesResult;
  entities: EntityItem[];
  entity_distribution: Record<string, number>;
  keywords: KeywordResults;
  topic: TopicClassification;
  events: EventItem[];
  relationships: RelationshipItem[];
  coreference: CoreferenceChainItem[];
  triples: KnowledgeTripleItem[];
  financial: FinancialAnalysisResult;
  graph: GraphData;
  pipeline_runs: ProcessingStageRun[];
  execution_time_ms: number;
  created_at: string;
}

export interface DashboardStats {
  summary: {
    total_articles: number;
    total_analyzed: number;
    total_sources: number;
    total_triples: number;
    total_entities: number;
    total_events: number;
  };
  articles_by_source: Array<{ source: string; count: number }>;
  topic_distribution: Array<{ topic: string; count: number }>;
  top_entities: Array<{ name: string; type: string; count: number }>;
  recent_articles: Array<{
    id: number;
    analysis_id: number;
    title: string;
    publisher: string;
    topic: string;
    published_at: string | null;
    created_at: string;
    word_count: number;
    tokens_count: number;
    execution_time_ms: number;
  }>;
  event_distribution: Array<{ type: string; count: number }>;
}

export interface CrossArticleComparisonResponse {
  articles_count: number;
  article_titles: string[];
  shared_entities: Array<{
    name: string;
    type: string;
    sources_count: number;
    sources: string[];
  }>;
  shared_keywords: Array<{
    keyword: string;
    sources_count: number;
    sources: string[];
  }>;
  similarity_matrix: number[][];
  timeline_events: Array<{
    event_type: string;
    actor: string | null;
    action: string;
    target: string | null;
    value: string | null;
    date: string | null;
    source: string;
    sentence: string;
  }>;
  source_summaries: Array<{
    publisher: string;
    title: string;
    summary: string;
    url: string;
  }>;
  synthesized_summary: string;
  potential_discrepancies: Array<{
    type: string;
    description: string;
    sources: string[];
    status: string;
  }>;
  combined_graph: GraphData;
  execution_time_ms: number;
}
