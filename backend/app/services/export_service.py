import io
import csv
import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Article, ArticleAnalysis, Entity, ExtractedEvent, Relationship, KnowledgeTriple
from app.nlp.knowledge_graph import KnowledgeGraphBuilder

class ExportService:
    @staticmethod
    def export_json(analysis_data: Dict[str, Any]) -> str:
        """Serializes full article analysis to formatted JSON."""
        # Convert non-serializable objects to ISO strings
        return json.dumps(analysis_data, default=str, indent=2)

    @staticmethod
    def export_csv_triples(triples: list) -> str:
        """Generates CSV for Knowledge Triples."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Subject", "Predicate", "Object", "Subject Type", "Object Type", "Confidence", "Supporting Sentence", "Source URL"])
        for t in triples:
            writer.writerow([
                t.get("subject", ""),
                t.get("predicate", ""),
                t.get("object", ""),
                t.get("subject_type", "ENTITY"),
                t.get("object_type", "ENTITY"),
                t.get("confidence", 0.85),
                t.get("supporting_sentence", ""),
                t.get("source_url", "")
            ])
        return output.getvalue()

    @staticmethod
    def export_csv_entities(entities: list) -> str:
        """Generates CSV for Extracted Entities."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Entity Text", "Category", "Frequency", "Context Sentence"])
        for e in entities:
            writer.writerow([
                e.get("text", ""),
                e.get("label", ""),
                e.get("frequency", 1),
                e.get("context_sentence", "")
            ])
        return output.getvalue()

    @staticmethod
    def export_csv_events(events: list) -> str:
        """Generates CSV for Structured Events."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Event Type", "Actor / Acquirer", "Target / Object", "Action", "Date", "Location", "Financial Value", "Supporting Sentence", "Confidence"])
        for ev in events:
            writer.writerow([
                ev.get("event_type", ""),
                ev.get("actor_acquirer", ""),
                ev.get("target_object", ""),
                ev.get("action", ""),
                ev.get("event_date", ""),
                ev.get("location", ""),
                ev.get("financial_value", ""),
                ev.get("supporting_sentence", ""),
                ev.get("confidence", 0.85)
            ])
        return output.getvalue()

    @staticmethod
    def export_graphml(triples: list, entities: list) -> str:
        """Generates GraphML format for import into Gephi, Cytoscape, or NetworkX."""
        return KnowledgeGraphBuilder.export_graphml(triples, entities)

    @staticmethod
    def generate_html_report(data: Dict[str, Any]) -> str:
        """Generate a formatted HTML analysis report."""
        title = data.get("article_title", "News Analysis Report")
        publisher = data.get("publisher", "Unknown Publisher")
        published_at = data.get("published_at") or "N/A"
        summary = data.get("summaries", {}).get("detailed") or data.get("summaries", {}).get("medium", "")
        topic = data.get("topic", {}).get("primary_topic", "General")
        conf = int(data.get("topic", {}).get("confidence", 0) * 100)

        entities_rows = "".join([
            f"<tr><td><b>{e['text']}</b></td><td><span class='badge'>{e['label']}</span></td><td>{e['frequency']}</td><td><em>{e.get('context_sentence', '')}</em></td></tr>"
            for e in data.get("entities", [])[:15]
        ])

        triples_rows = "".join([
            f"<tr><td><b>{t['subject']}</b></td><td><span class='pred'>{t['predicate']}</span></td><td><b>{t['object']}</b></td><td><em>{t['supporting_sentence']}</em></td></tr>"
            for t in data.get("triples", [])[:15]
        ])

        events_rows = "".join([
            f"<tr><td><b>{ev['event_type']}</b></td><td>{ev.get('actor_acquirer') or '-'}</td><td>{ev.get('action')}</td><td>{ev.get('target_object') or '-'}</td><td>{ev.get('financial_value') or '-'}</td></tr>"
            for ev in data.get("events", [])
        ])

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title} - AI Knowledge Extraction Report</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 40px; margin: 0; }}
        .container {{ max-width: 960px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
        h1 {{ color: #0f172a; margin-top: 0; font-size: 26px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
        h2 {{ color: #2563eb; font-size: 18px; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }}
        .meta {{ display: flex; gap: 20px; color: #64748b; font-size: 14px; margin-bottom: 25px; }}
        .meta-item {{ background: #f1f5f9; padding: 6px 14px; border-radius: 6px; font-weight: 500; }}
        .summary-box {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 18px; border-radius: 0 8px 8px 0; margin-bottom: 25px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }}
        th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
        th {{ background: #f8fafc; color: #475569; font-weight: 600; }}
        .badge {{ background: #dbeafe; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }}
        .pred {{ color: #d97706; font-weight: 600; }}
        .footer {{ margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{title}</h1>
        <div class="meta">
            <div class="meta-item">📰 Publisher: {publisher}</div>
            <div class="meta-item">📅 Date: {published_at}</div>
            <div class="meta-item">🏷️ Topic: {topic} ({conf}%)</div>
            <div class="meta-item">Engine: KnowBrief analysis</div>
        </div>

        <h2>Executive Extractive Summary</h2>
        <div class="summary-box">
            <p>{summary}</p>
        </div>

        <h2>Subject-Predicate-Object Knowledge Triples</h2>
        <table>
            <thead>
                <tr><th>Subject</th><th>Predicate</th><th>Object</th><th>Evidence Sentence</th></tr>
            </thead>
            <tbody>
                {triples_rows if triples_rows else "<tr><td colspan='4'>No triples extracted.</td></tr>"}
            </tbody>
        </table>

        <h2>Extracted Named Entities</h2>
        <table>
            <thead>
                <tr><th>Entity</th><th>Category</th><th>Frequency</th><th>Context</th></tr>
            </thead>
            <tbody>
                {entities_rows if entities_rows else "<tr><td colspan='4'>No entities extracted.</td></tr>"}
            </tbody>
        </table>

        <h2>Structured Events</h2>
        <table>
            <thead>
                <tr><th>Event Type</th><th>Actor / Acquirer</th><th>Action</th><th>Target / Object</th><th>Financial Value</th></tr>
            </thead>
            <tbody>
                {events_rows if events_rows else "<tr><td colspan='5'>No structured events identified.</td></tr>"}
            </tbody>
        </table>

        <div class="footer">
            Generated by KnowBrief
        </div>
    </div>
</body>
</html>"""
        return html_content
