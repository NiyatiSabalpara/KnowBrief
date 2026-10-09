from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, PlainTextResponse, HTMLResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Article, ArticleAnalysis
from app.services.analysis_service import AnalysisService
from app.services.export_service import ExportService

router = APIRouter()

@router.get("/articles/{article_id}/export")
def export_article_analysis(
    article_id: int,
    format: str = Query("json", description="Export format: json, csv_triples, csv_entities, csv_events, graphml, html"),
    db: Session = Depends(get_db)
):
    """
    Exports extracted knowledge into JSON, CSV, GraphML, or styled HTML report.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")

    analysis = db.query(ArticleAnalysis).filter(ArticleAnalysis.article_id == article.id).order_by(ArticleAnalysis.id.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Article has not been analyzed yet.")

    data = AnalysisService.format_analysis_response(db, article, analysis)
    safe_title = "".join(c for c in article.title[:30] if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")

    if format == "json":
        json_content = ExportService.export_json(data)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=analysis_{safe_title}_{article_id}.json"}
        )

    elif format == "csv_triples":
        csv_content = ExportService.export_csv_triples(data.get("triples", []))
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=knowledge_triples_{safe_title}_{article_id}.csv"}
        )

    elif format == "csv_entities":
        csv_content = ExportService.export_csv_entities(data.get("entities", []))
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=entities_{safe_title}_{article_id}.csv"}
        )

    elif format == "csv_events":
        csv_content = ExportService.export_csv_events(data.get("events", []))
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=events_{safe_title}_{article_id}.csv"}
        )

    elif format == "graphml":
        graphml_content = ExportService.export_graphml(data.get("triples", []), data.get("entities", []))
        return Response(
            content=graphml_content,
            media_type="application/xml",
            headers={"Content-Disposition": f"attachment; filename=knowledge_graph_{safe_title}_{article_id}.graphml"}
        )

    elif format == "html":
        html_report = ExportService.generate_html_report(data)
        return HTMLResponse(content=html_report)

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {format}")
