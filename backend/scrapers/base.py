import re
from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from backend.ingestion import ingest_scraper_batch

# Standard Advance Purchase Windows
WINDOW_DAYS_MAP = {
    "T+1": 1,
    "T+7": 7,
    "T+15": 15,
    "T+30": 30,
    "T+45": 45,
}

# Top 6 DGCA corridors for targeted live extraction
TOP_6_ROUTES = [
    "DEL-BOM",
    "DEL-BLR",
    "BOM-BLR",
    "DEL-CCU",
    "BLR-HYD",
    "MAA-DEL",
]

# Airline code heuristics from flight number prefix or airline brand name
AIRLINE_CODE_MAP = {
    "6E": "6E",
    "AI": "AI",
    "IX": "IX",
    "QP": "QP",
    "SG": "SG",
    "INDIGO": "6E",
    "AIR INDIA": "AI",
    "AIR INDIA EXPRESS": "IX",
    "AIRINDIAEXPRESS": "IX",
    "AKASA": "QP",
    "AKASAAIR": "QP",
    "SPICEJET": "SG",
}


class BaseFlightScraper(ABC):
    """Abstract Base Class for flight scrapers."""

    def __init__(self, platform_code: str, headless: bool = True):
        """
        Args:
            platform_code: OTA or Airline code ('EMT', 'MMT', '6E', etc.)
            headless: Whether to run Playwright in headless mode.
        """
        self.platform_code = platform_code
        self.headless = headless

    @staticmethod
    def get_flight_date(advance_window: str, base_date: Optional[date] = None) -> date:
        """Calculates flight date for a given booking horizon (T+1, T+7, etc.)."""
        if base_date is None:
            base_date = date.today()
        days_ahead = WINDOW_DAYS_MAP.get(advance_window)
        if days_ahead is None:
            raise ValueError(
                f"Unknown advance window: '{advance_window}'. Supported: {list(WINDOW_DAYS_MAP.keys())}"
            )
        return base_date + timedelta(days=days_ahead)

    @staticmethod
    def parse_fare(fare_str: str) -> float:
        """Cleans fare string like '₹6,530', 'Rs. 7,420', '6,790' to float."""
        cleaned = re.sub(r"[^\d.]", "", fare_str)
        return float(cleaned) if cleaned else 0.0

    @staticmethod
    def parse_duration(duration_str: str) -> int:
        """Converts strings like '02h 15m', '2h', '135m' to total minutes."""
        hours = 0
        minutes = 0
        h_match = re.search(r"(\d+)\s*h", duration_str, re.I)
        m_match = re.search(r"(\d+)\s*m", duration_str, re.I)
        if h_match:
            hours = int(h_match.group(1))
        if m_match:
            minutes = int(m_match.group(1))
        total = hours * 60 + minutes
        return total if total > 0 else 120

    @staticmethod
    def identify_airline_code(flight_number: str, airline_name: str = "") -> str:
        """Resolves standard 2-letter IATA code from flight number or name."""
        prefix = (
            flight_number.split("-")[0].strip().upper()
            if "-" in flight_number
            else flight_number[:2].upper()
        )
        if prefix in AIRLINE_CODE_MAP:
            return AIRLINE_CODE_MAP[prefix]

        cleaned_name = re.sub(r"[^A-Z]", "", airline_name.upper())
        for key, code in AIRLINE_CODE_MAP.items():
            if key in cleaned_name:
                return code

        return "6E"  # Default fallback if ambiguous

    @abstractmethod
    def search_route_window(self, route_code: str, advance_window: str) -> dict:
        """
        Executes a flight search for a specific route and advance window.
        Returns a dictionary containing:
            route_code, advance_window, quotes, raw_payload, latency_ms, status, http_status
        """
        pass

    def ingest_results(self, search_result: dict) -> dict:
        """Persists extracted search results into the database via ingest_scraper_batch."""
        return ingest_scraper_batch(
            route_code=search_result["route_code"],
            airline_code=self.platform_code,
            quotes=search_result.get("quotes", []),
            crawler_status=search_result.get("status", "SUCCESS"),
            http_status=search_result.get("http_status", 200),
            latency_ms=search_result.get("latency_ms", 0),
            proxy_ip=search_result.get("proxy_ip"),
            user_agent=search_result.get("user_agent"),
            error_message=search_result.get("error_message"),
            raw_payload=search_result.get("raw_payload"),
        )
