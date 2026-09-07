"""
Scrapers Package for MoSPI Real-time Airfare Price Index (APIx).
Provides Playwright-based dynamic live flight scrapers with anti-bot resilience,
automated snapshot hashing, and database ingestion.
"""

from backend.scrapers.base import BaseFlightScraper
from backend.scrapers.playwright_scraper import PlaywrightFlightScraper

__all__ = [
    "BaseFlightScraper",
    "PlaywrightFlightScraper",
]
