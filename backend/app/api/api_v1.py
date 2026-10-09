from fastapi import APIRouter
from app.api.routes_news import router as news_router
from app.api.routes_analysis import router as analysis_router
from app.api.routes_graph import router as graph_router
from app.api.routes_compare import router as compare_router
from app.api.routes_export import router as export_router
from app.api.routes_dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(news_router, tags=["News Discovery & Ingestion"])
api_router.include_router(analysis_router, tags=["Article Analysis & NLP"])
api_router.include_router(graph_router, tags=["Knowledge Graph"])
api_router.include_router(compare_router, tags=["Cross-Article Explorer"])
api_router.include_router(export_router, tags=["Export & Reporting"])
api_router.include_router(dashboard_router, tags=["Dashboard & Statistics"])
