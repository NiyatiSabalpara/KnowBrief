import logging
import re
import httpx
from bs4 import BeautifulSoup
import trafilatura
from app.core.config import settings
from app.core.security import is_safe_url

logger = logging.getLogger(__name__)

class ArticleExtractor:
    """
    Extracts article title, clean content, author, published date, and thumbnail
    from raw HTML or URLs using Trafilatura and BeautifulSoup fallbacks.
    """

    @staticmethod
    async def fetch_url_content(url: str) -> tuple[str | None, str | None]:
        """
        Safely fetches HTML content of a URL with timeouts, headers, and SSRF checks.
        Returns (html_content, error_message).
        """
        if not is_safe_url(url):
            return None, "Blocked: URL violates security policy or resolves to a private IP range."
            
        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        
        try:
            async with httpx.AsyncClient(
                timeout=settings.REQUEST_TIMEOUT_SECONDS,
                follow_redirects=True,
                verify=False
            ) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 403:
                    return None, "Publisher returned HTTP 403 Forbidden (Subscription / Anti-Bot protection)."
                if response.status_code == 429:
                    return None, "Publisher returned HTTP 429 Too Many Requests (Rate limit exceeded)."
                if response.status_code >= 400:
                    return None, f"Publisher returned HTTP {response.status_code}."
                    
                return response.text, None
        except httpx.TimeoutException:
            return None, "Connection timed out while fetching publisher page."
        except Exception as e:
            return None, f"Failed to retrieve page: {str(e)}"

    @classmethod
    def extract_from_html(cls, html: str, url: str | None = None) -> dict:
        """
        Extracts clean text and metadata from HTML string.
        """
        # 1. First try state-of-the-art Trafilatura
        extracted = trafilatura.extract(
            html,
            url=url,
            include_comments=False,
            include_tables=True,
            no_fallback=False,
            output_format="txt"
        )
        
        # Extract metadata
        meta = trafilatura.extract_metadata(html, default_url=url)
        title = meta.title if meta and meta.title else None
        author = meta.author if meta and meta.author else None
        date = meta.date if meta and meta.date else None
        image = meta.image if meta and meta.image else None
        description = meta.description if meta and meta.description else None

        # 2. If trafilatura text is short or failed, fallback to BeautifulSoup extraction
        if not extracted or len(extracted.strip()) < 100:
            soup = BeautifulSoup(html, "lxml")
            
            # Remove scripts, styles, navs, headers, footers, ads
            for tag in soup(["script", "style", "nav", "header", "footer", "aside", "noscript", "iframe", "svg"]):
                tag.decompose()
                
            # Try finding article tag or main content div
            main_element = soup.find("article") or soup.find("main") or soup.find("div", {"id": re.compile(r"article|content|story|main", re.I)}) or soup.find("div", {"class": re.compile(r"article|content|story|main", re.I)})
            
            if main_element:
                paragraphs = main_element.find_all(["p", "h2", "h3"])
            else:
                paragraphs = soup.find_all("p")
                
            clean_paras = [p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 30]
            extracted = "\n\n".join(clean_paras)
            
            if not title and soup.title:
                title = soup.title.get_text().strip()

        # Clean text
        cleaned_text = cls.clean_extracted_text(extracted or "")
        
        return {
            "title": title,
            "text": cleaned_text,
            "author": author,
            "date": date,
            "image": image,
            "description": description,
            "word_count": len(cleaned_text.split()) if cleaned_text else 0
        }

    @staticmethod
    def clean_extracted_text(text: str) -> str:
        """Removes duplicate lines, advertising phrases, cookie notices, and trims whitespace."""
        if not text:
            return ""
            
        lines = text.split("\n")
        cleaned_lines = []
        seen = set()
        
        boilerplates = [
            "subscribe now", "all rights reserved", "terms and conditions",
            "privacy policy", "click here", "read more", "sign in", "advertisement",
            "follow us on twitter", "download our app"
        ]
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            line_lower = line_str.lower()
            
            # Skip if boilerplate
            if any(b in line_lower and len(line_str) < 100 for b in boilerplates):
                continue
                
            # Avoid repeating duplicate paragraphs
            if line_str in seen and len(line_str) > 40:
                continue
                
            seen.add(line_str)
            cleaned_lines.append(line_str)
            
        return "\n\n".join(cleaned_lines)
