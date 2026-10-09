import time
from typing import Dict, List, Any, Optional
import networkx as nx

ENTITY_COLOR_PALETTE = {
    "ORGANIZATION": {"background": "#3B82F6", "border": "#1D4ED8", "highlight": "#60A5FA"},
    "ORG": {"background": "#3B82F6", "border": "#1D4ED8", "highlight": "#60A5FA"},
    "PERSON": {"background": "#10B981", "border": "#047857", "highlight": "#34D399"},
    "LOCATION": {"background": "#8B5CF6", "border": "#6D28D9", "highlight": "#A78BFA"},
    "LOCATION (GPE)": {"background": "#8B5CF6", "border": "#6D28D9", "highlight": "#A78BFA"},
    "GPE": {"background": "#8B5CF6", "border": "#6D28D9", "highlight": "#A78BFA"},
    "MONEY": {"background": "#F59E0B", "border": "#B45309", "highlight": "#FBBF24"},
    "PERCENT": {"background": "#F59E0B", "border": "#B45309", "highlight": "#FBBF24"},
    "PRODUCT": {"background": "#EC4899", "border": "#BE185D", "highlight": "#F472B6"},
    "EVENT": {"background": "#6366F1", "border": "#4338CA", "highlight": "#818CF8"},
    "DATE": {"background": "#14B8A6", "border": "#0F766E", "highlight": "#2DD4BF"},
    "DEFAULT": {"background": "#64748B", "border": "#334155", "highlight": "#94A3B8"}
}

class KnowledgeGraphBuilder:
    """
    Constructs multi-directed NetworkX Knowledge Graph from extracted entities,
    events, and semantic relationships. Formats nodes and edges for interactive
    visualizations and computes structural graph metrics.
    """

    @classmethod
    def build_graph(
        cls,
        triples: List[Dict[str, Any]],
        entities: List[Dict[str, Any]],
        article_url: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()
        
        G = nx.MultiDiGraph()
        
        # Entity type lookup table
        entity_types = {}
        for ent in entities:
            entity_types[ent["text"].lower()] = ent["label"]

        # Add nodes and edges from triples
        nodes_dict = {}
        edges_list = []

        edge_counter = 0

        for t in triples:
            subj = str(t.get("subject", "")).strip()
            pred = str(t.get("predicate", "")).strip()
            obj = str(t.get("object", "")).strip()
            sentence = t.get("supporting_sentence", "")
            src_url = t.get("source_url") or article_url

            if not subj or not obj or subj.lower() == obj.lower():
                continue

            subj_id = subj.lower()
            obj_id = obj.lower()

            subj_type = entity_types.get(subj_id, t.get("subject_type", "ENTITY"))
            obj_type = entity_types.get(obj_id, t.get("object_type", "ENTITY"))

            # Register subject node
            if subj_id not in nodes_dict:
                color = ENTITY_COLOR_PALETTE.get(subj_type, ENTITY_COLOR_PALETTE["DEFAULT"])
                nodes_dict[subj_id] = {
                    "id": subj_id,
                    "label": subj,
                    "title": f"<b>{subj}</b><br>Type: {subj_type}",
                    "group": subj_type,
                    "size": 26,
                    "color": color,
                    "data": {"entity_type": subj_type, "name": subj, "connected_facts": []}
                }
                G.add_node(subj_id, label=subj, type=subj_type)

            # Register object node
            if obj_id not in nodes_dict:
                color = ENTITY_COLOR_PALETTE.get(obj_type, ENTITY_COLOR_PALETTE["DEFAULT"])
                nodes_dict[obj_id] = {
                    "id": obj_id,
                    "label": obj,
                    "title": f"<b>{obj}</b><br>Type: {obj_type}",
                    "group": obj_type,
                    "size": 22,
                    "color": color,
                    "data": {"entity_type": obj_type, "name": obj, "connected_facts": []}
                }
                G.add_node(obj_id, label=obj, type=obj_type)

            # Record fact on nodes
            fact_desc = f"{subj} → {pred} → {obj}"
            nodes_dict[subj_id]["data"]["connected_facts"].append(fact_desc)
            nodes_dict[obj_id]["data"]["connected_facts"].append(fact_desc)

            # Add Edge
            edge_id = f"edge_{edge_counter}"
            edge_counter += 1

            edge_obj = {
                "id": edge_id,
                "from": subj_id,
                "to": obj_id,
                "label": pred,
                "title": f"<b>Relationship:</b> {pred}<br><b>Evidence:</b> {sentence}",
                "arrows": "to",
                "font": {"size": 11, "align": "middle", "strokeWidth": 2, "strokeColor": "#ffffff"},
                "data": {
                    "predicate": pred,
                    "subject": subj,
                    "object": obj,
                    "evidence_sentence": sentence,
                    "source_url": src_url
                }
            }
            edges_list.append(edge_obj)
            G.add_edge(subj_id, obj_id, key=edge_id, relation=pred, sentence=sentence)

        # Graph Metrics
        total_nodes = len(nodes_dict)
        total_edges = len(edges_list)
        density = round(nx.density(G), 3) if total_nodes > 1 else 0.0

        # Degree calculation for node sizing
        if total_nodes > 0:
            for node_id, deg in G.degree():
                if node_id in nodes_dict:
                    nodes_dict[node_id]["size"] = max(20, min(45, 20 + deg * 4))

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "nodes": list(nodes_dict.values()),
            "edges": edges_list,
            "stats": {
                "total_nodes": total_nodes,
                "total_edges": total_edges,
                "density": density,
                "connected_components": nx.number_weakly_connected_components(G) if total_nodes > 0 else 0
            },
            "execution_time_ms": round(elapsed_ms, 2)
        }

    @classmethod
    def export_graphml(cls, triples: List[Dict[str, Any]], entities: List[Dict[str, Any]]) -> str:
        """Exports the knowledge graph in standard GraphML XML interchange format."""
        G = nx.DiGraph()
        
        for t in triples:
            subj = t.get("subject", "")
            pred = t.get("predicate", "")
            obj = t.get("object", "")
            if subj and obj:
                G.add_node(subj, name=subj)
                G.add_node(obj, name=obj)
                G.add_edge(subj, obj, relation=pred)

        import io
        output = io.BytesIO()
        nx.write_graphml(G, output)
        return output.getvalue().decode("utf-8")
