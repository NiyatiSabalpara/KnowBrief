import asyncio
import pytest
from app.news_sources.manager import news_manager

@pytest.mark.asyncio
async def test_live_source_connectivity():
    """
    Live News Source Verification Test:
    Tests real network connectivity to publisher feeds.
    """
    sources_to_test = ["toi", "ht", "bbc", "the_hindu", "indian_express", "ft", "techcrunch"]
    print("\n--- Testing Live News Publisher Connectivity ---")
    
    results = {}
    for code in sources_to_test:
        if code in news_manager.adapters:
            adapter = news_manager.adapters[code]
            try:
                articles = await adapter.fetch_latest(limit=3)
                results[code] = {
                    "name": adapter.name,
                    "status": "PASS" if len(articles) > 0 else "EMPTY_FEED",
                    "count": len(articles),
                    "sample_title": articles[0].title if articles else None
                }
            except Exception as e:
                results[code] = {
                    "name": adapter.name,
                    "status": f"FAIL: {str(e)}",
                    "count": 0,
                    "sample_title": None
                }

    print("\nLive Source Results:")
    for code, info in results.items():
        print(f"[{info['status']}] {info['name']} ({code}): {info['count']} articles retrieved. Sample: {info['sample_title']}")

    # Ensure at least one live source returned real news
    successful_sources = [k for k, v in results.items() if v["count"] > 0]
    assert len(successful_sources) >= 1, "At least one real publisher source must be operational."
