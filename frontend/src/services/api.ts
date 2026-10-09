import axios from 'axios';
import {
  NewsSource,
  NewsArticle,
  ArticleAnalysisResponse,
  DashboardStats,
  CrossArticleComparisonResponse,
  GraphData
} from '../types';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Sources
  getSources: async (): Promise<NewsSource[]> => {
    const res = await apiClient.get('/sources');
    return res.data;
  },

  // News Discovery
  searchNews: async (params?: {
    q?: string;
    source?: string;
    category?: string;
    limit?: number;
  }): Promise<{ count: number; articles: NewsArticle[] }> => {
    const res = await apiClient.get('/news/search', { params });
    return res.data;
  },

  getArticle: async (articleId: number): Promise<NewsArticle> => {
    const res = await apiClient.get(`/news/article/${articleId}`);
    return res.data;
  },

  // Ingestion & Direct Analysis
  analyzeDirectUrl: async (url: string): Promise<ArticleAnalysisResponse> => {
    const res = await apiClient.post('/articles/analyze-url', { url });
    return res.data;
  },

  analyzeDirectText: async (payload: {
    title: string;
    text: string;
    source_name?: string;
    category?: string;
  }): Promise<ArticleAnalysisResponse> => {
    const res = await apiClient.post('/articles/analyze-text', payload);
    return res.data;
  },

  // Analysis Pipeline
  analyzeArticle: async (articleId: number, forceRecompute: boolean = false): Promise<ArticleAnalysisResponse> => {
    const res = await apiClient.post('/articles/analyze', {
      article_id: articleId,
      force_recompute: forceRecompute
    });
    return res.data;
  },

  getArticleResults: async (articleId: number): Promise<ArticleAnalysisResponse> => {
    const res = await apiClient.get(`/articles/${articleId}/results`);
    return res.data;
  },

  getAnalysisHistory: async (limit: number = 50): Promise<{ count: number; history: any[] }> => {
    const res = await apiClient.get('/articles/history', { params: { limit } });
    return res.data;
  },

  deleteArticle: async (articleId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/articles/${articleId}`);
    return res.data;
  },

  // Knowledge Graphs
  getArticleGraph: async (articleId: number): Promise<GraphData> => {
    const res = await apiClient.get(`/articles/${articleId}/graph`);
    return res.data;
  },

  getGlobalGraph: async (params?: { limit?: number; entity_type?: string }): Promise<GraphData> => {
    const res = await apiClient.get('/graph/global', { params });
    return res.data;
  },

  // Cross-Article Explorer
  compareArticles: async (articleIds: number[]): Promise<CrossArticleComparisonResponse> => {
    const res = await apiClient.post('/articles/compare', { article_ids: articleIds });
    return res.data;
  },

  // Dashboard Metrics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  },

  // Export URLs
  getExportUrl: (articleId: number, format: string) => {
    return `${API_BASE_URL}/articles/${articleId}/export?format=${format}`;
  }
};
