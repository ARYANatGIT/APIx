"""
Automated Verification Script for Playwright Live Flight Scraper.
Tests live flight extraction for DEL-BOM on T+7 window, validates DOM parsing,
ensures SHA-256 snapshot hashing, and verifies database persistence in price_quotes.
"""

import hashlib
import sys
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

from backend.config import SNAPSHOTS_DIR
from backend.database import SessionLocal, init_db
from backend.models import Route, Airline, PriceQuote, ScraperAuditLog
from backend.seed_data import seed_database
from backend.scrapers.playwright_scraper import PlaywrightFlightScraper


def run_verification():
    print("=" * 80)
    print("[VERIFY] LIVE SCRAPER EXTRACTION & DATABASE AUDIT VERIFICATION")
    print("=" * 80)

    # 1. Ensure database is ready
    print("\n[STEP 1] Checking Database Initialization...")
    init_db()
    seed_database()
    print("  [PASS] Database schema & baseline models verified.")

    db = SessionLocal()
    try:
        initial_quotes_count = db.query(PriceQuote).count()
        initial_logs_count = db.query(ScraperAuditLog).count()
        print(f"  [INFO] Initial Price Quotes count: {initial_quotes_count}")
        print(f"  [INFO] Initial Audit Logs count:   {initial_logs_count}")

        # 2. Run Playwright Scraper on DEL-BOM for T+7
        test_route = "DEL-BOM"
        test_window = "T+7"
        print(
            f"\n[STEP 2] Launching Playwright Live Extraction on {test_route} ({test_window})..."
        )

        with PlaywrightFlightScraper(platform_code="EMT", headless=True) as scraper:
            search_res = scraper.search_route_window(test_route, test_window)

            quotes = search_res.get("quotes", [])
            status = search_res.get("status")
            latency = search_res.get("latency_ms", 0)
            raw_payload = search_res.get("raw_payload", "")

            print(
                f"  [STATUS] Scraper Status: {status} (HTTP {search_res.get('http_status')})"
            )
            print(f"  [STATUS] Round-trip Latency: {latency} ms")
            print(f"  [STATUS] Extracted Live Quotes: {len(quotes)}")
            print(f"  [STATUS] Raw HTML Payload Size: {len(raw_payload):,} bytes")

            assert len(quotes) > 0, (
                f"Extraction failed! No quotes parsed. Status: {status}"
            )
            assert len(raw_payload) > 1000, "Raw HTML payload is unexpectedly small!"

            # Show sample quote
            sample = quotes[0]
            print(f"\n  Sample Extracted Quote:")
            print(
                f"    - Flight:    {sample.get('flight_number')} ({sample.get('airline_code')})"
            )
            print(
                f"    - Dep/Arr:   {sample.get('departure_time')} -> {sample.get('arrival_time')} ({sample.get('duration_mins')} mins)"
            )
            print(f"    - Stops:     {sample.get('stops')} stop(s)")
            print(
                f"    - Fare Type: {sample.get('fare_type')} ({sample.get('cabin_class')})"
            )
            print(f"    - Total:     INR {sample.get('total_fare'):,.2f}")

            # 3. Persist into database
            print("\n[STEP 3] Ingesting Live Quotes & Raw Snapshot into Database...")
            ingest_result = scraper.ingest_results(search_res)
            print(
                f"  [PASS] Ingestion Result: {ingest_result['status']} | Saved: {ingest_result['quotes_saved']} quotes"
            )

            snapshot_hash = ingest_result.get("snapshot_hash")
            assert snapshot_hash is not None, "Snapshot hash was not generated!"
            print(f"  [PASS] Proof-of-Source SHA-256 Hash: {snapshot_hash}")

        # 4. Verify Database Records
        print("\n[STEP 4] Verifying Database Records & Physical Audit Files...")
        new_quotes_count = db.query(PriceQuote).count()
        new_logs_count = db.query(ScraperAuditLog).count()

        quotes_diff = new_quotes_count - initial_quotes_count
        logs_diff = new_logs_count - initial_logs_count

        print(
            f"  [PASS] Net Quotes Added: {quotes_diff} (Total now: {new_quotes_count})"
        )
        print(f"  [PASS] Net Audit Logs Added: {logs_diff}")
        assert quotes_diff == len(quotes), (
            f"Expected {len(quotes)} quotes inserted, but got {quotes_diff}"
        )

        # Verify quote details in database
        latest_quote = db.query(PriceQuote).order_by(PriceQuote.id.desc()).first()
        assert latest_quote.snapshot_hash == snapshot_hash, (
            "Stored snapshot hash does not match!"
        )
        assert latest_quote.snapshot_path is not None, "Snapshot path not recorded!"
        assert latest_quote.total_fare > 0, "Price quote fare must be positive!"
        print(
            f"  [PASS] DB Quote ID: {latest_quote.id} | Route ID: {latest_quote.route_id} | Fare: INR {latest_quote.total_fare}"
        )

        # Verify physical snapshot file on disk
        stored_path = Path(latest_quote.snapshot_path)
        full_disk_path = BASE_DIR / stored_path
        print(f"  [PASS] Physical Snapshot File: {full_disk_path}")
        assert full_disk_path.exists(), (
            f"Physical snapshot file not found on disk at {full_disk_path}!"
        )

        # Verify hash matches disk content
        disk_content = full_disk_path.read_text(encoding="utf-8")
        computed_hash = hashlib.sha256(disk_content.encode("utf-8")).hexdigest()
        assert computed_hash == snapshot_hash, (
            f"Hash mismatch: computed {computed_hash} != stored {snapshot_hash}"
        )
        print(
            f"  [PASS] Cryptographic SHA-256 integrity of raw snapshot on disk verified!"
        )

        # Verify audit log record
        latest_log = (
            db.query(ScraperAuditLog).order_by(ScraperAuditLog.id.desc()).first()
        )
        assert latest_log.status == "SUCCESS", (
            f"Expected SUCCESS log, found {latest_log.status}"
        )
        assert latest_log.quotes_extracted == len(quotes), (
            "Audit log quotes count mismatch!"
        )
        print(
            f"  [PASS] Crawler Audit Log ID: {latest_log.id} | Status: {latest_log.status} | Latency: {latest_log.latency_ms}ms"
        )

        print("\n" + "=" * 80)
        print("[SUCCESS] PLAYWRIGHT SCRAPER & AUDIT PIPELINE VERIFIED SUCCESSFULLY!")
        print("=" * 80)
        return True

    except Exception as err:
        print(f"\n[FAIL] Verification encountered an error: {err}")
        import traceback

        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
