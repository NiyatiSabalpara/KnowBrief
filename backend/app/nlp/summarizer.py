import time
from typing import Dict, List, Any
import networkx as nx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")

class TextRankSummarizer:
    """
    Extractive news summarization using the TextRank graph centrality algorithm.
    Builds a complete sentence-similarity graph based on TF-IDF cosine distances,
    ranks sentences via PageRank, and selects top-ranking sentences in original narrative order.
    """

    @classmethod
    def summarize(cls, text: str, sentences: List[str] | None = None) -> Dict[str, Any]:
        start_time = time.perf_counter()
        if not text:
            return {
                "short": "",
                "medium": "",
                "detailed": "",
                "abstractive": None,
                "method": "TextRank Graph Centrality",
                "execution_time_ms": 0.0
            }

        # Sentence segmentation
        if not sentences or len(sentences) == 0:
            doc = nlp(text)
            sentences = [s.text.strip() for s in doc.sents if len(s.text.strip()) > 20]

        total_sents = len(sentences)
        if total_sents <= 3:
            full_summary = " ".join(sentences)
            return {
                "short": full_summary,
                "medium": full_summary,
                "detailed": full_summary,
                "abstractive": None,
                "method": "TextRank (Short Document Fallback)",
                "execution_time_ms": round((time.perf_counter() - start_time) * 1000.0, 2)
            }

        try:
            # Build TF-IDF sentence matrix
            vectorizer = TfidfVectorizer(stop_words="english", lowercase=True)
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Sentence similarity matrix
            sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

            # Build NetworkX sentence graph
            nx_graph = nx.from_numpy_array(sim_matrix)
            
            # Remove self-loops
            nx_graph.remove_edges_from(nx.selfloop_edges(nx_graph))

            # Run PageRank
            scores = nx.pagerank(nx_graph, max_iter=200, alpha=0.85)

            # Score each sentence with position bias (lead sentence bias in journalism)
            ranked_sentences = []
            for i, s in enumerate(sentences):
                # Lead bias (first sentences in news articles contain the lead)
                pos_weight = 1.25 if i == 0 else (1.1 if i == 1 else 1.0)
                final_score = scores.get(i, 0.0) * pos_weight
                ranked_sentences.append((i, s, final_score))

            # Sort by rank score to pick top sentences
            by_score = sorted(ranked_sentences, key=lambda x: x[2], reverse=True)

            def get_summary_text(target_count: int) -> str:
                picked = by_score[:min(target_count, total_sents)]
                # Re-sort by original appearance order for coherence
                picked_in_order = sorted(picked, key=lambda x: x[0])
                return " ".join([item[1] for item in picked_in_order])

            short_summary = get_summary_text(2)
            medium_summary = get_summary_text(4)
            detailed_summary = get_summary_text(7)

        except Exception:
            # Fallback to lead sentences
            short_summary = " ".join(sentences[:2])
            medium_summary = " ".join(sentences[:4])
            detailed_summary = " ".join(sentences[:7])

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "short": short_summary,
            "medium": medium_summary,
            "detailed": detailed_summary,
            "abstractive": None,
            "method": "TextRank Graph-Based Centrality & Lexical Salience",
            "execution_time_ms": round(elapsed_ms, 2)
        }
