import argparse
import logging
import sys
import time
from pathlib import Path

# Enforce UTF-8 stdout if supported
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.database import SessionLocal, init_db
from backend.seed_data import seed_database
from backend.scrapers.base import TOP_6_ROUTES, WINDOW_DAYS_MAP
from backend.scrapers.playwright_scraper import PlaywrightFlightScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("run_live_scraper")


def run_live_corridors(
    routes: list[str] = None,
    windows: list[str] = None,
    platform: str = "EMT",
    headless: bool = True,
    delay_secs: float = 2.0,
) -> dict:
    """
    Executes live flight scraping for specified routes and advance booking windows.

    Args:
        routes: List of route codes (e.g. ["DEL-BOM", "DEL-BLR", ...])
        windows: List of booking horizons (e.g. ["T+1", "T+7", ...])
        platform: Entity code ('EMT', 'MMT', etc.)
        headless: Whether to run Playwright in headless mode
        delay_secs: Throttling pause between requests
    """
    if routes is None:
        routes = TOP_6_ROUTES
    if windows is None:
        windows = list(WINDOW_DAYS_MAP.keys())

    # Ensure baseline database schema and master routes/airlines exist
    init_db()
    seed_database()

    print("=" * 80)
    print("MoSPI Real-time Airfare Price Index (APIx) - Live Flight Scraper")
    print(f"Target Routes ({len(routes)}): {', '.join(routes)}")
    print(f"Advance Windows ({len(windows)}): {', '.join(windows)}")
    print(f"Total Search Runs: {len(routes) * len(windows)}")
    print("=" * 80)

    total_quotes_collected = 0
    successful_runs = 0
    failed_runs = 0
    run_records = []

    start_total_time = time.time()

    with PlaywrightFlightScraper(platform_code=platform, headless=headless) as scraper:
        for r_idx, route in enumerate(routes, 1):
            print(f"\n[{r_idx}/{len(routes)}] Corridors: {route}")
            print("-" * 65)

            for w_idx, win in enumerate(windows, 1):
                print(f"  -> Scraping {route} on {win} window...", end=" ", flush=True)

                search_res = scraper.search_route_window(route, win)
                quotes_count = len(search_res.get("quotes", []))
                status = search_res.get("status")
                latency = search_res.get("latency_ms", 0)

                # Persist to database if quotes extracted or audit log required
                ingest_res = scraper.ingest_results(search_res)

                if quotes_count > 0:
                    successful_runs += 1
                    total_quotes_collected += quotes_count
                    hash_preview = ingest_res.get("snapshot_hash", "")[:8]
                    print(
                        f"OK: {quotes_count} quotes | {latency}ms | snapshot: {hash_preview}"
                    )
                else:
                    failed_runs += 1
                    print(f"FAILED ({status}) | {latency}ms")

                run_records.append(
                    {
                        "route": route,
                        "window": win,
                        "quotes": quotes_count,
                        "status": status,
                        "latency_ms": latency,
                    }
                )

                # Polite crawling delay between requests
                if delay_secs > 0:
                    time.sleep(delay_secs)

    total_time = round(time.time() - start_total_time, 2)
    print("\n" + "=" * 80)
    print("SCRAPE RUN COMPLETED")
    print("=" * 80)
    print(f"Total Routes Covered:      {len(routes)}")
    print(f"Total Windows Evaluated:   {len(windows)}")
    print(f"Successful Tasks:          {successful_runs}/{len(run_records)}")
    print(f"Total Live Quotes Ingested:{total_quotes_collected}")
    print(f"Total Run Duration:        {total_time}s")
    print("=" * 80)

    return {
        "total_quotes": total_quotes_collected,
        "successful_runs": successful_runs,
        "failed_runs": failed_runs,
        "run_records": run_records,
    }


def main():
    parser = argparse.ArgumentParser(description="Live Flight Scraper for MoSPI APIx")
    parser.add_argument(
        "--routes",
        type=str,
        default=",".join(TOP_6_ROUTES),
        help="Comma-separated route codes (e.g. DEL-BOM,DEL-BLR)",
    )
    parser.add_argument(
        "--windows",
        type=str,
        default=",".join(WINDOW_DAYS_MAP.keys()),
        help="Comma-separated advance windows (e.g. T+1,T+7,T+15,T+30,T+45)",
    )
    parser.add_argument(
        "--platform",
        type=str,
        default="EMT",
        help="Scraping platform code ('EMT', 'MMT')",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=True,
        help="Run browser in headless mode",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.0,
        help="Delay in seconds between scrape requests",
    )

    args = parser.parse_args()
    routes_list = [r.strip() for r in args.routes.split(",") if r.strip()]
    windows_list = [w.strip() for w in args.windows.split(",") if w.strip()]

    run_live_corridors(
        routes=routes_list,
        windows=windows_list,
        platform=args.platform,
        headless=args.headless,
        delay_secs=args.delay,
    )


if __name__ == "__main__":
    main()
