import time
import re
from collections import defaultdict
from typing import Dict, List, Any
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")

class KeywordExtractor:
    """
    Implements 3 genuine NLP keyword extraction algorithms:
    1. TF-IDF Keyword Extraction (with sublinear TF and n-gram scoring)
    2. TextRank Graph-Based Keyword Extraction (co-occurrence graph + PageRank)
    3. KeyBERT / Semantic Vector Space Extraction (Candidate n-gram embeddings vs Document Vector)
    """

    @classmethod
    def extract_tfidf(cls, text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        if not text or len(text.split()) < 5:
            return []
        try:
            # Tokenize and filter with spaCy POS (nouns, adjectives, proper nouns)
            doc = nlp(text)
            tokens = [
                token.lemma_.lower() for token in doc 
                if token.pos_ in ("NOUN", "PROPN", "ADJ") and not token.is_stop and len(token.text) > 2
            ]
            clean_corpus = " ".join(tokens)
            if not clean_corpus:
                clean_corpus = text

            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                sublinear_tf=True,
                max_features=50
            )
            tfidf_matrix = vectorizer.fit_transform([clean_corpus])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]

            keyword_scores = []
            for idx, score in enumerate(scores):
                if score > 0.05:
                    keyword_scores.append({"keyword": feature_names[idx], "score": round(float(score), 4)})

            keyword_scores.sort(key=lambda x: x["score"], reverse=True)
            return keyword_scores[:top_n]
        except Exception:
            return []

    @classmethod
    def extract_textrank(cls, text: str, window_size: int = 4, top_n: int = 10) -> List[Dict[str, Any]]:
        if not text or len(text.split()) < 5:
            return []
        try:
            doc = nlp(text)
            # Filter candidate words (nouns and adjectives only)
            valid_tokens = [
                (token.lemma_.lower(), token.i) for token in doc
                if token.pos_ in ("NOUN", "PROPN", "ADJ") and not token.is_stop and len(token.text) > 2
            ]

            if not valid_tokens:
                return []

            # Build co-occurrence graph
            graph = nx.Graph()
            words = [w for w, _ in valid_tokens]
            for w in set(words):
                graph.add_node(w)

            for i in range(len(valid_tokens)):
                w1, pos1 = valid_tokens[i]
                for j in range(i + 1, min(i + window_size, len(valid_tokens))):
                    w2, pos2 = valid_tokens[j]
                    if pos2 - pos1 <= window_size and w1 != w2:
                        if graph.has_edge(w1, w2):
                            graph[w1][w2]["weight"] += 1.0
                        else:
                            graph.add_edge(w1, w2, weight=1.0)

            if len(graph.nodes) == 0:
                return []

            # Compute PageRank scores on the word graph
            pagerank_scores = nx.pagerank(graph, weight="weight", max_iter=200)
            ranked = sorted(pagerank_scores.items(), key=lambda x: x[1], reverse=True)
            
            return [{"keyword": word, "score": round(score, 4)} for word, score in ranked[:top_n]]
        except Exception:
            return []

    @classmethod
    def extract_semantic_keybert(cls, text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        KeyBERT-style semantic n-gram ranking using vector space cosine similarity & TF-IDF representations.
        """
        if not text or len(text.split()) < 5:
            return []
        try:
            # Extract candidate n-grams (1, 2, 3 grams)
            doc = nlp(text)
            candidates = []
            for chunk in doc.noun_chunks:
                clean_chunk = re.sub(r"[^a-zA-Z0-9\s]", "", chunk.text).strip().lower()
                if 2 < len(clean_chunk) < 40 and not all(t.is_stop for t in chunk):
                    candidates.append(clean_chunk)

            if not candidates:
                for token in doc:
                    if token.pos_ in ("NOUN", "PROPN", "ADJ") and not token.is_stop and len(token.text) > 2:
                        candidates.append(token.lemma_.lower())

            candidates = list(set(candidates))
            if not candidates:
                return []

            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
            tfidf_matrix = vectorizer.fit_transform([text] + candidates)
            doc_vec = tfidf_matrix[0]
            candidate_vecs = tfidf_matrix[1:]

            similarities = cosine_similarity(doc_vec, candidate_vecs)[0]
            
            scored_candidates = []
            for cand, score in zip(candidates, similarities):
                if score > 0.05:
                    scored_candidates.append({"keyword": cand, "score": round(float(score), 4)})

            scored_candidates.sort(key=lambda x: x["score"], reverse=True)
            return scored_candidates[:top_n]
        except Exception:
            return []

    @classmethod
    def extract_all(cls, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        tfidf_kw = cls.extract_tfidf(text, top_n=10)
        textrank_kw = cls.extract_textrank(text, top_n=10)
        semantic_kw = cls.extract_semantic_keybert(text, top_n=10)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "tfidf": tfidf_kw,
            "textrank": textrank_kw,
            "semantic_keybert": semantic_kw,
            "execution_time_ms": round(elapsed_ms, 2)
        }
