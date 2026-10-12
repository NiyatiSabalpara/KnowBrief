import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.api.api_v1 import api_router
from app.services.news_service import NewsService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("knowbrief")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Initialize news sources
    db = SessionLocal()
    try:
        NewsService.ensure_sources_initialized(db)
    finally:
        db.close()
        
    logger.info(f"{settings.PROJECT_NAME} backend started successfully.")
    yield
    logger.info("Shutting down backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="From News to Connected Knowledge. Explore summaries, entities, events, relationships, and knowledge graphs extracted from reporting.",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite_connected"
    }

@app.get("/")
def root():
    return {
        "message": "KnowBrief API is active.",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
