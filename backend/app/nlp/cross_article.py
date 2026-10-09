import time
from collections import Counter, defaultdict
from typing import Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.nlp.knowledge_graph import KnowledgeGraphBuilder

class CrossArticleExplorer:
    """
    Analyzes multiple articles covering the same or related topics:
    - Finds shared entities and overlapping keywords
    - Calculates pairwise semantic similarity matrix
    - Aggregates timeline of events with publisher attribution
    - Generates synthesized cross-article summary
    - Identifies potential discrepancies / divergent claims
    - Constructs unified multi-source knowledge graph
    """

    @classmethod
    def compare_articles(cls, analyzed_articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        start_time = time.perf_counter()
        
        if not analyzed_articles or len(analyzed_articles) < 2:
            return {
                "error": "At least two articles are required for cross-article comparison."
            }

        article_titles = [a.get("title", f"Article {i+1}") for i, a in enumerate(analyzed_articles)]
        article_texts = [a.get("full_text") or a.get("summary_medium") or "" for a in analyzed_articles]

        # 1. Pairwise Similarity Matrix using TF-IDF Cosine Distance
        try:
            vectorizer = TfidfVectorizer(stop_words="english")
            tfidf_matrix = vectorizer.fit_transform(article_texts)
            sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
            sim_matrix_list = [[round(float(val), 3) for val in row] for row in sim_matrix]
        except Exception:
            sim_matrix_list = [[1.0 if i == j else 0.5 for j in range(len(analyzed_articles))] for i in range(len(analyzed_articles))]

        # 2. Identify Shared Entities across Articles
        entity_sources = defaultdict(set)
        entity_types = {}
        for a in analyzed_articles:
            pub = a.get("publisher", "Unknown Source")
            for ent in a.get("entities", []):
                ent_name = ent.get("text", "").strip()
                if len(ent_name) > 1:
                    entity_sources[ent_name].add(pub)
                    entity_types[ent_name] = ent.get("label", "ENTITY")

        shared_entities = []
        for ent_name, sources in entity_sources.items():
            if len(sources) >= 2:
                shared_entities.append({
                    "name": ent_name,
                    "type": entity_types.get(ent_name, "ENTITY"),
                    "sources_count": len(sources),
                    "sources": list(sources)
                })

        shared_entities.sort(key=lambda x: x["sources_count"], reverse=True)

        # 3. Identify Shared Keywords
        keyword_sources = defaultdict(set)
        for a in analyzed_articles:
            pub = a.get("publisher", "Unknown Source")
            kw_data = a.get("keywords", {})
            # Combine tfidf and textrank keywords
            all_kw = [k.get("keyword") for k in kw_data.get("tfidf", [])] + [k.get("keyword") for k in kw_data.get("textrank", [])]
            for kw in all_kw:
                if kw:
                    keyword_sources[kw.lower()].add(pub)

        shared_keywords = []
        for kw, sources in keyword_sources.items():
            if len(sources) >= 2:
                shared_keywords.append({
                    "keyword": kw,
                    "sources_count": len(sources),
                    "sources": list(sources)
                })
        shared_keywords.sort(key=lambda x: x["sources_count"], reverse=True)

        # 4. Source-by-Source Summaries and Timeline Events
        source_summaries = []
        timeline_events = []
        all_triples = []
        all_entities = []

        for a in analyzed_articles:
            pub = a.get("publisher", "Unknown Source")
            title = a.get("title", "")
            summary = a.get("summary_medium") or a.get("summary_short") or ""
            source_summaries.append({
                "publisher": pub,
                "title": title,
                "summary": summary,
                "url": a.get("url", "")
            })

            # Events
            for ev in a.get("events", []):
                timeline_events.append({
                    "event_type": ev.get("event_type"),
                    "actor": ev.get("actor_acquirer"),
                    "action": ev.get("action"),
                    "target": ev.get("target_object"),
                    "value": ev.get("financial_value"),
                    "date": ev.get("event_date"),
                    "source": pub,
                    "sentence": ev.get("supporting_sentence")
                })

            # Collect triples and entities for combined graph
            all_triples.extend(a.get("triples", []))
            all_entities.extend(a.get("entities", []))

        # 5. Synthesized Multi-Source Summary
        lead_sentences = []
        for s in source_summaries:
            first_sent = s["summary"].split(".")[0] if s["summary"] else ""
            if first_sent:
                lead_sentences.append(f"[{s['publisher']}] {first_sent.strip()}.")
                
        synthesized_summary = " ".join(lead_sentences) if lead_sentences else "No multi-article summary could be generated."

        # 6. Potential Discrepancies Detector (Differing numbers or money mentions)
        discrepancies = []
        money_by_source = defaultdict(list)
        for a in analyzed_articles:
            pub = a.get("publisher", "Unknown Source")
            for ent in a.get("entities", []):
                if ent.get("label") in ("MONEY", "PERCENT", "NUMERICAL", "CARDINAL"):
                    money_by_source[pub].append(ent.get("text"))

        # Look for different figures cited by publishers
        if len(money_by_source) >= 2:
            sources_list = list(money_by_source.keys())
            for i in range(len(sources_list)):
                for j in range(i + 1, len(sources_list)):
                    s1, s2 = sources_list[i], sources_list[j]
                    diff1 = set(money_by_source[s1]) - set(money_by_source[s2])
                    diff2 = set(money_by_source[s2]) - set(money_by_source[s1])
                    if diff1 and diff2:
                        discrepancies.append({
                            "type": "Numerical Figure Variance",
                            "description": f"{s1} cited figures {list(diff1)[:2]}, whereas {s2} reported {list(diff2)[:2]}.",
                            "sources": [s1, s2],
                            "status": "Divergent Claim for Review"
                        })

        # 7. Build Combined Knowledge Graph
        combined_graph = KnowledgeGraphBuilder.build_graph(all_triples, all_entities)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "articles_count": len(analyzed_articles),
            "article_titles": article_titles,
            "shared_entities": shared_entities[:15],
            "shared_keywords": shared_keywords[:15],
            "similarity_matrix": sim_matrix_list,
            "timeline_events": timeline_events[:15],
            "source_summaries": source_summaries,
            "synthesized_summary": synthesized_summary,
            "potential_discrepancies": discrepancies[:5],
            "combined_graph": combined_graph,
            "execution_time_ms": round(elapsed_ms, 2)
        }
