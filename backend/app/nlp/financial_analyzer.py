import re
import time
from typing import Dict, List, Any

class FinancialAnalyzer:
    """
    Specialized analyzer for Financial and Business News.
    Extracts tickers, numerical claims, revenue/profit figures, percentage movements,
    and funding amounts with contextual grounding.
    """

    TICKER_PATTERN = r"\b([A-Z]{1,5}|[A-Z]{2,6}:[A-Z]{1,5})\b"
    PERCENT_PATTERN = r"([+\-]?\s?\d+(?:\.\d+)?\s?%)"
    MONEY_PATTERN = r"((?:\$|€|£|₹|Rs\.?|USD|INR|EUR|GBP)\s?\d+(?:,\d+)*(?:\.\d+)?\s?(?:billion|million|trillion|crore|lakh|B|M|k)?)"

    FINANCIAL_KEYWORDS = [
        "revenue", "profit", "quarter", "earnings", "guidance", "shares",
        "nasdaq", "nyse", "investors", "dividend", "valuation", "fund",
        "market cap", "inflation", "interest rate", "bonds", "yield"
    ]

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        if not text:
            return {
                "is_financial": False,
                "summary": "No text provided.",
                "tickers": [],
                "funding_and_deals": [],
                "numerical_claims": [],
                "revenue_profits": [],
                "market_sentiment": "Neutral",
                "execution_time_ms": 0.0
            }

        text_lower = text.lower()
        matched_kw = [kw for kw in cls.FINANCIAL_KEYWORDS if kw in text_lower]
        is_financial = len(matched_kw) >= 2 or any(c in text for c in ["$", "€", "£", "₹", "%"])

        # 1. Extract stock tickers (explicit uppercase symbols, avoiding common English words)
        potential_tickers = set(re.findall(r"\$([A-Z]{1,5})\b", text))
        exchange_tickers = set(re.findall(r"\b(NYSE|NASDAQ|NSE|BSE):([A-Z]{1,5})\b", text))
        
        tickers_list = list(potential_tickers)
        for ex, sym in exchange_tickers:
            tickers_list.append(f"{ex}:{sym}")

        # 2. Extract Numerical Claims with Context Sentences
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        numerical_claims = []
        revenue_profits = []
        funding_deals = []

        seen_claims = set()

        for sent in sentences:
            # Check for % changes
            perc_matches = re.findall(cls.PERCENT_PATTERN, sent)
            for p in perc_matches:
                if len(numerical_claims) < 15 and sent not in seen_claims:
                    seen_claims.add(sent)
                    numerical_claims.append({
                        "metric_type": "Percentage Change / Metric",
                        "entity": None,
                        "raw_value": p.strip(),
                        "normalized_value": cls._parse_num(p),
                        "unit_currency": "%",
                        "context_sentence": sent
                    })

            # Check for Money amounts
            money_matches = re.findall(cls.MONEY_PATTERN, sent, re.I)
            for m in money_matches:
                if len(numerical_claims) < 15 and sent not in seen_claims:
                    seen_claims.add(sent)
                    numerical_claims.append({
                        "metric_type": "Monetary Valuation / Figure",
                        "entity": None,
                        "raw_value": m.strip(),
                        "normalized_value": None,
                        "unit_currency": cls._extract_currency(m),
                        "context_sentence": sent
                    })

            # Check for Revenue / Profit statements
            if any(k in sent.lower() for k in ["revenue", "profit", "net income", "sales of", "loss of"]):
                for m in money_matches:
                    revenue_profits.append({
                        "figure": m.strip(),
                        "context": sent
                    })

            # Check for Funding / Deals
            if any(k in sent.lower() for k in ["raised", "funding", "invested", "valuation of", "series a", "series b", "series c", "acquisition"]):
                for m in money_matches:
                    funding_deals.append({
                        "deal_value": m.strip(),
                        "context": sent
                    })

        # Sentiment heuristic for market tone
        positive_words = ["surged", "jumped", "growth", "profit", "gain", "rally", "record", "exceeded", "beat", "bullish"]
        negative_words = ["dropped", "slumped", "loss", "decline", "fell", "cut", "plunged", "missed", "bearish", "inflation"]
        
        pos_count = sum(text_lower.count(w) for w in positive_words)
        neg_count = sum(text_lower.count(w) for w in negative_words)
        
        if pos_count > neg_count + 1:
            sentiment = "Bullish / Positive Growth"
        elif neg_count > pos_count + 1:
            sentiment = "Bearish / Downward Pressure"
        else:
            sentiment = "Neutral / Balanced"

        summary_desc = (
            f"Identified {len(numerical_claims)} financial metrics, "
            f"{len(tickers_list)} stock symbols, and {len(funding_deals)} transactions. Market tone: {sentiment}."
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "is_financial": is_financial,
            "summary": summary_desc,
            "tickers": tickers_list,
            "funding_and_deals": funding_deals[:6],
            "numerical_claims": numerical_claims[:10],
            "revenue_profits": revenue_profits[:6],
            "market_sentiment": sentiment,
            "execution_time_ms": round(elapsed_ms, 2)
        }

    @staticmethod
    def _parse_num(val_str: str) -> float | None:
        try:
            cleaned = re.sub(r"[^\d.-]", "", val_str)
            return float(cleaned)
        except Exception:
            return None

    @staticmethod
    def _extract_currency(money_str: str) -> str:
        if "$" in money_str or "USD" in money_str.upper():
            return "USD ($)"
        if "€" in money_str or "EUR" in money_str.upper():
            return "EUR (€)"
        if "£" in money_str or "GBP" in money_str.upper():
            return "GBP (£)"
        if "₹" in money_str or "RS" in money_str.upper() or "INR" in money_str.upper():
            return "INR (₹)"
        return "Currency Unit"
