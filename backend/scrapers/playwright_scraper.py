"""
Playwright Flight Scraper Implementation for MoSPI APIx.
Automates headless Chromium extraction of live flight price quotes,
handles dynamic JavaScript hydration and popup dismissals,
computes raw HTML snapshots for auditability, and persists results into the database.
"""

import logging
import re
import time
from datetime import date, datetime, timezone
from typing import Optional

from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page

from backend.scrapers.base import (
    BaseFlightScraper,
    TOP_6_ROUTES,
    WINDOW_DAYS_MAP,
)

logger = logging.getLogger(__name__)

# IATA Code to Portal City Name Mapping
CITY_NAMES = {
    "DEL": "Delhi",
    "BOM": "Mumbai",
    "BLR": "Bangalore",
    "CCU": "Kolkata",
    "HYD": "Hyderabad",
    "MAA": "Chennai",
    "GOI": "Goa",
}


class PlaywrightFlightScraper(BaseFlightScraper):
    """
    Production-grade Playwright Scraper targeting dynamic travel portals.
    Default platform: EaseMyTrip ('EMT') - extracts IndiGo, Air India,
    Akasa Air, SpiceJet, and Air India Express quotes in real-time.
    """

    def __init__(self, platform_code: str = "EMT", headless: bool = True):
        super().__init__(platform_code=platform_code, headless=headless)
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None

    def start(self):
        """Initializes Playwright engine and browser context with anti-detection flags."""
        if self.playwright is None:
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-infobars",
                    "--window-size=1280,800",
                ],
            )
            self.context = self.browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
                locale="en-IN",
                timezone_id="Asia/Kolkata",
            )
            # Evade navigator.webdriver detection
            self.context.add_init_script(
                "delete Object.getPrototypeOf(navigator).webdriver;"
            )

    def close(self):
        """Cleanly terminates browser and Playwright process."""
        if self.context:
            self.context.close()
            self.context = None
        if self.browser:
            self.browser.close()
            self.browser = None
        if self.playwright:
            self.playwright.stop()
            self.playwright = None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def build_search_url(self, origin: str, dest: str, flight_date: date) -> str:
        """Constructs the search query URL for the corridor and flight date."""
        orig_city = CITY_NAMES.get(origin, origin)
        dest_city = CITY_NAMES.get(dest, dest)
        date_str = flight_date.strftime("%d/%m/%Y")
        return (
            f"https://flight.easemytrip.com/FlightList/Index?"
            f"srch={origin}-{orig_city}-India|{dest}-{dest_city}-India|{date_str}"
            f"&px=1-0-0&cbn=0&ar=undefined&isOneway=true&isAutoSearch=false&IsHideDetails=true"
        )

    def _dismiss_popups(self, page: Page):
        """Finds and closes promotional modals, notification banners, or cookie notices."""
        selectors = [
            ".modal-close",
            "#btnNoThanks",
            "#divNotification .close",
            ".cross-btn",
            ".close_icon",
            "button:has-text('No Thanks')",
            "button:has-text('Maybe Later')",
            "div.popup-close",
        ]
        for sel in selectors:
            try:
                el = page.query_selector(sel)
                if el and el.is_visible():
                    el.click(timeout=1000)
            except Exception:
                pass

    def extract_flight_cards(
        self, page: Page, flight_date: date, advance_window: str, source_url: str
    ) -> list[dict]:
        """Parses flight card elements from the rendered page DOM."""
        raw_cards = page.evaluate("""() => {
            const cards = document.querySelectorAll('div.fltResult');
            const data = [];
            for (let card of cards) {
                // Get full text lines
                const text = card.innerText || '';
                data.push(text);
            }
            return data;
        }""")

        quotes = []
        for text in raw_cards:
            try:
                lines = [line.strip() for line in text.split("\n") if line.strip()]
                if not lines or len(lines) < 4:
                    continue

                # 1. Flight Number & Airline
                # Common patterns: IX-1165, 6E-204, AI-887, QP-1110, SG-8169, or AI 887
                flt_match = re.search(r"\b([A-Z0-9]{2})[- ]?(\d{3,4})\b", text)
                if not flt_match:
                    continue

                carrier_code = flt_match.group(1).upper()
                flt_digits = flt_match.group(2)
                flight_number = f"{carrier_code}-{flt_digits}"
                airline_code = self.identify_airline_code(carrier_code)

                # 2. Times (Departure and Arrival in HH:MM format)
                times = re.findall(r"\b([012]\d:[0-5]\d)\b", text)
                if len(times) < 2:
                    continue
                dep_time = times[0]
                arr_time = times[1]

                # 3. Duration
                dur_match = re.search(r"(\d+h\s*\d*m?)", text, re.I)
                duration_mins = (
                    self.parse_duration(dur_match.group(1)) if dur_match else 120
                )

                # 4. Stops
                stops = 0
                if re.search(r"1\s*stop", text, re.I):
                    stops = 1
                elif re.search(r"2\s*stop", text, re.I):
                    stops = 2

                # 5. Price
                # Prices formatted like '6,790', '7,420', '12,500'
                # Find all currency-like numbers and take the base flight price
                prices = re.findall(
                    r"(?:₹|Rs\.?|\s|^)(\d{1,2},\d{3}|\d{4,5})(?!\d)", text
                )
                if not prices:
                    continue

                # Convert first valid price to float
                fare_candidates = [
                    self.parse_fare(p) for p in prices if self.parse_fare(p) >= 1500.0
                ]
                if not fare_candidates:
                    continue
                total_fare = fare_candidates[0]

                # 6. Fare Type & Cabin Class
                fare_type = "Standard"
                if "SAVER" in text.upper():
                    fare_type = "Saver"
                elif "FLEX" in text.upper() or "FLEXI" in text.upper():
                    fare_type = "Flexi"
                elif "VALUE" in text.upper():
                    fare_type = "Value"

                cabin_class = "Economy"
                if "BUSINESS" in text.upper():
                    cabin_class = "Business"

                # 7. Seats remaining if indicated
                seats_rem = None
                seat_match = re.search(r"(\d+)\s*seats?\s*left", text, re.I)
                if seat_match:
                    seats_rem = int(seat_match.group(1))

                quote = {
                    "airline_code": airline_code,
                    "flight_number": flight_number,
                    "flight_date": flight_date.isoformat(),
                    "advance_window": advance_window,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "duration_mins": duration_mins,
                    "stops": stops,
                    "cabin_class": cabin_class,
                    "fare_type": fare_type,
                    "total_fare": total_fare,
                    "seats_remaining": seats_rem,
                    "source_url": source_url,
                }
                quotes.append(quote)

            except Exception as parse_err:
                logger.debug(f"Error parsing individual flight card: {parse_err}")
                continue

        return quotes

    def search_route_window(self, route_code: str, advance_window: str) -> dict:
        """
        Executes a live search for a specific route and advance window.
        Returns parsed quotes, crawler audit metadata, and raw HTML snapshot payload.
        """
        if self.browser is None:
            self.start()

        parts = route_code.split("-")
        origin, dest = parts[0], parts[1]
        flight_date = self.get_flight_date(advance_window)
        search_url = self.build_search_url(origin, dest, flight_date)

        start_time = time.time()
        page: Optional[Page] = None
        raw_html = ""
        quotes = []
        status = "SUCCESS"
        http_status = 200
        error_msg = None

        try:
            page = self.context.new_page()
            logger.info(
                f"Navigating to {route_code} ({advance_window}, {flight_date}): {search_url}"
            )

            # Navigate with generous timeout for complex airline DOM hydration
            response = page.goto(
                search_url, wait_until="domcontentloaded", timeout=45000
            )
            if response:
                http_status = response.status

            # Wait for flight card container or error/empty indicators
            try:
                page.wait_for_selector("div.fltResult", timeout=18000)
            except Exception:
                logger.warning(
                    f"Timeout waiting for div.fltResult on {route_code} ({advance_window})"
                )

            # Dismiss popups and let pricing finish rendering
            self._dismiss_popups(page)
            time.sleep(2)

            # Capture complete raw HTML snapshot for proof-of-source audit
            raw_html = page.content()

            # Extract structured flight quotes
            quotes = self.extract_flight_cards(
                page, flight_date, advance_window, search_url
            )

            if not quotes:
                if "Access Denied" in raw_html or "Cloudflare" in raw_html:
                    status = "BLOCKED_CLOUDFLARE"
                elif "captcha" in raw_html.lower():
                    status = "CAPTCHA_TRIGGERED"
                else:
                    status = "NO_FLIGHTS_FOUND"

        except Exception as exc:
            status = "ERROR"
            error_msg = str(exc)
            logger.error(f"Scraper error on {route_code} ({advance_window}): {exc}")

        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            if page:
                try:
                    page.close()
                except Exception:
                    pass

        return {
            "route_code": route_code,
            "advance_window": advance_window,
            "flight_date": flight_date.isoformat(),
            "search_url": search_url,
            "quotes": quotes,
            "quotes_extracted": len(quotes),
            "raw_payload": raw_html,
            "status": status,
            "http_status": http_status,
            "latency_ms": latency_ms,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
            "error_message": error_msg,
        }
