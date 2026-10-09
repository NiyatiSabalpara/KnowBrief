import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import engine, Base, SessionLocal
from app.services.news_service import NewsService

# Ensure tables exist
Base.metadata.create_all(bind=engine)
db = SessionLocal()
NewsService.ensure_sources_initialized(db)
db.close()

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_get_sources():
    response = client.get("/api/sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) >= 7
    source_codes = [s["code"] for s in sources]
    assert "ft" in source_codes
    assert "toi" in source_codes
    assert "ht" in source_codes
    assert "bbc" in source_codes

def test_analyze_direct_text():
    sample_payload = {
        "title": "Quantum Leap in Solar Energy",
        "text": (
            "Apex Renewable Energy unveiled a breakthrough perovskite solar panel in Bengaluru on Friday. "
            "The energy giant invested $300 million in next-generation manufacturing facilities. "
            "Managing Director Priya Nair reported that the panels achieve a 28% conversion efficiency. "
            "Apex partnered with the National Solar Institute to deploy the technology across rural India."
        ),
        "source_name": "Solar Tech Review",
        "category": "Environment"
    }
    response = client.post("/api/articles/analyze-text", json=sample_payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "triples" in data
    assert len(data["triples"]) > 0
    assert "graph" in data
    assert len(data["entities"]) > 0
    assert data["topic"]["primary_topic"] is not None

def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "summary" in stats
    assert stats["summary"]["total_articles"] >= 1
