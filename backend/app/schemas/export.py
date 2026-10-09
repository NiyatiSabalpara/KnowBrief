from pydantic import BaseModel
from typing import Any

class ExportRequest(BaseModel):
    format: str = "json"  # json, csv, graphml, html

class ExportStatsResponse(BaseModel):
    article_id: int
    format: str
    filename: str
    download_url: str
    size_bytes: int
