"""
Command-line Flight Search Tool for MoSPI APIx.
Searches live flight prices for any route and specific calendar date.

Usage:
    python backend/search_flight.py --route DEL-BLR --date 2026-10-10
    python backend/search_flight.py --from DEL --to BLR --date 10/10/2026
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

# Enforce UTF-8 stdout if supported
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.scrapers.playwright_scraper import PlaywrightFlightScraper

CARRIER_NAMES = {
    "6E": "IndiGo",
    "AI": "Air India",
    "IX": "Air India Express",
    "QP": "Akasa Air",
    "SG": "SpiceJet",
    "EMT": "EaseMyTrip",
}


def parse_date(date_str: str):
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%Y", "%d %b %Y"]:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    raise ValueError(
        f"Could not parse date '{date_str}'. Use YYYY-MM-DD or DD/MM/YYYY."
    )


def search_flight_prices(
    origin: str, destination: str, flight_date, save_db: bool = True
):
    route_code = f"{origin.upper()}-{destination.upper()}"
    print("=" * 78)
    print(
        f"Searching Live Flights: {route_code} on {flight_date.strftime('%d %b %Y (%A)')}"
    )
    print("=" * 78)
    print("Launching Playwright browser engine & fetching real-time portal quotes...\n")

    with PlaywrightFlightScraper(platform_code="EMT", headless=True) as scraper:
        url = scraper.build_search_url(origin, destination, flight_date)
        page = scraper.context.new_page()

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            try:
                page.wait_for_selector("div.fltResult", timeout=20000)
            except Exception:
                pass

            scraper._dismiss_popups(page)
            raw_payload = page.content()
            quotes = scraper.extract_flight_cards(page, flight_date, "Custom", url)

            if not quotes:
                print("No flights found or page took too long to render.")
                return []

            # Ingest into DB if requested
            if save_db:
                search_res = {
                    "route_code": route_code,
                    "advance_window": "Custom",
                    "quotes": quotes,
                    "raw_payload": raw_payload,
                    "status": "SUCCESS",
                    "http_status": 200,
                    "latency_ms": 5000,
                }
                scraper.ingest_results(search_res)

            # Sort by total fare ascending
            quotes.sort(key=lambda q: q["total_fare"])

            print(f"Found {len(quotes)} live flights. Top 15 lowest fares:\n")
            print(
                f"{'Flight':<10} {'Airline':<20} {'Dep -> Arr':<16} {'Duration':<10} {'Stops':<10} {'Fare (INR)':<12}"
            )
            print("-" * 78)

            for q in quotes[:15]:
                carrier_name = CARRIER_NAMES.get(q["airline_code"], q["airline_code"])
                stops_text = "Non-stop" if q["stops"] == 0 else f"{q['stops']} stop(s)"
                dep_arr = f"{q['departure_time']} -> {q['arrival_time']}"
                dur_text = f"{q['duration_mins']} mins"
                fare_text = f"INR {q['total_fare']:,.2f}"
                print(
                    f"{q['flight_number']:<10} {carrier_name:<20} {dep_arr:<16} {dur_text:<10} {stops_text:<10} {fare_text:<12}"
                )

            print("-" * 78)
            cheapest = quotes[0]
            print(
                f"\nLowest Available Fare: INR {cheapest['total_fare']:,.2f} ({CARRIER_NAMES.get(cheapest['airline_code'], cheapest['airline_code'])}, Flight {cheapest['flight_number']})"
            )
            return quotes

        finally:
            page.close()


def main():
    parser = argparse.ArgumentParser(
        description="Live Flight Search Tool for MoSPI APIx"
    )
    parser.add_argument(
        "--route", type=str, default="DEL-BLR", help="Corridor code, e.g. DEL-BLR"
    )
    parser.add_argument(
        "--from",
        dest="origin",
        type=str,
        default=None,
        help="Origin airport code, e.g. DEL",
    )
    parser.add_argument(
        "--to",
        dest="destination",
        type=str,
        default=None,
        help="Destination airport code, e.g. BLR",
    )
    parser.add_argument(
        "--date",
        type=str,
        default="2026-10-10",
        help="Flight date, e.g. 2026-10-10 or 10/10/2026",
    )
    parser.add_argument(
        "--no-save", action="store_true", help="Do not save to database"
    )

    args = parser.parse_args()

    if args.origin and args.destination:
        origin = args.origin.upper()
        destination = args.destination.upper()
    elif args.route and "-" in args.route:
        parts = args.route.split("-")
        origin = parts[0].upper()
        destination = parts[1].upper()
    else:
        origin = "DEL"
        destination = "BLR"

    f_date = parse_date(args.date)
    search_flight_prices(origin, destination, f_date, save_db=not args.no_save)


if __name__ == "__main__":
    main()
