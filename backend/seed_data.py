import sys
import random
import hashlib
from datetime import datetime, timezone, timedelta, date
from pathlib import Path

# Enforce UTF-8 stdout if supported
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

from backend.database import SessionLocal, init_db
from backend.models import (
    Route,
    DGCARouteWeight,
    Airline,
    PriceQuote,
    ScraperAuditLog,
    AirfareIndexRecord
)
from backend.dgca_data import AIRLINES_DATA, DGCA_ROUTES_DATA
from backend.config import settings

# Route base price anchor (standard economy base fare for average 1,000 km route)
BASE_RATE_PER_KM = 3.85  # INR per km average base economy rate

WINDOW_DAYS_MAP = {
    "T+1": 1,
    "T+7": 7,
    "T+15": 15,
    "T+30": 30,
    "T+45": 45
}

# Dynamic surge multiplier by advance booking window
WINDOW_SURGE_MULTIPLIER = {
    "T+1": 1.75,
    "T+7": 1.25,
    "T+15": 1.00,
    "T+30": 0.88,
    "T+45": 0.80
}


def seed_database():
    print("[INIT] Initializing database schema...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Seed Airlines
        print("[1/5] Seeding Airlines and OTAs...")
        airline_map = {}
        for a_data in AIRLINES_DATA:
            existing = db.query(Airline).filter_by(code=a_data["code"]).first()
            if not existing:
                airline = Airline(**a_data)
                db.add(airline)
                db.flush()
                airline_map[airline.code] = airline
            else:
                airline_map[existing.code] = existing

        # 2. Seed Routes & DGCA Weights
        print("[2/5] Seeding DGCA Route Basket and Traffic Weights...")
        route_map = {}
        for r_data in DGCA_ROUTES_DATA:
            existing = db.query(Route).filter_by(route_code=r_data["route_code"]).first()
            if not existing:
                route = Route(
                    route_code=r_data["route_code"],
                    origin_code=r_data["origin_code"],
                    origin_city=r_data["origin_city"],
                    origin_airport=r_data["origin_airport"],
                    origin_state=r_data["origin_state"],
                    origin_lat=r_data["origin_lat"],
                    origin_lon=r_data["origin_lon"],
                    destination_code=r_data["destination_code"],
                    destination_city=r_data["destination_city"],
                    destination_airport=r_data["destination_airport"],
                    destination_state=r_data["destination_state"],
                    destination_lat=r_data["destination_lat"],
                    destination_lon=r_data["destination_lon"],
                    distance_km=r_data["distance_km"],
                )
                db.add(route)
                db.flush()
                route_map[route.route_code] = route

                # Add DGCA weight
                weight = DGCARouteWeight(
                    route_id=route.id,
                    reporting_year=2024,
                    annual_passengers=r_data["annual_passengers"],
                    passenger_share=r_data["passenger_share"],
                    weight=r_data["normalized_weight"],
                    source_document="DGCA Domestic Air Passenger Traffic Report 2024"
                )
                db.add(weight)
            else:
                route_map[existing.route_code] = existing

        db.commit()

        # 3. Ingest Authentic Normalized Flight Quotes
        print("[3/5] Loading Authentic Scraped Price Quotes...")
        existing_quotes_count = db.query(PriceQuote).count()
        normalized_file = DATA_DIR / "all_normalized_flights.json"

        if normalized_file.exists():
            from backend.ingestion import ingest_normalized_file
            res = ingest_normalized_file(normalized_file, clear_previous_scrapes=True, db=db)
            print(f"[OK] Ingested {res['quotes_saved']:,} authentic live flight quotes into database.")
        else:
            print(f"[INFO] {existing_quotes_count} price quotes already present.")

        # 4. Seed Scraper Audit Logs
        print("[4/5] Seeding Scraper Resilience Audit Logs...")
        if db.query(ScraperAuditLog).count() == 0:
            sample_logs = []
            statuses = [
                ("SUCCESS", 200, 1850, 42),
                ("SUCCESS", 200, 2100, 38),
                ("SUCCESS", 200, 1620, 45),
                ("CAPTCHA_BYPASSED", 200, 4800, 40),
                ("SUCCESS", 200, 1950, 44),
                ("BLOCKED_CLOUDFLARE_RECOVERED", 200, 5200, 36),
            ]
            for a in airline_map.values():
                for route_code in ["DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU"]:
                    status, http_code, latency, count = random.choice(statuses)
                    log = ScraperAuditLog(
                        airline_id=a.id,
                        route_code=route_code,
                        status=status,
                        http_status=http_code,
                        latency_ms=latency + random.randint(-150, 250),
                        quotes_extracted=count,
                        proxy_ip=f"103.25.{random.randint(10, 250)}.{random.randint(1, 254)}",
                        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        timestamp=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 720))
                    )
                    sample_logs.append(log)
            db.bulk_save_objects(sample_logs)
            db.commit()
            print(f"[OK] Created {len(sample_logs)} crawler audit records.")

        # 5. Seed Initial Airfare Price Index (APIx) Records (30 Days)
        print("[5/5] Calculating & Seeding Initial APIx Macro Index Records (30 Days)...")
        if db.query(AirfareIndexRecord).count() < 30:
            db.query(AirfareIndexRecord).delete()
            index_records = []
            today = date.today()
            base_apix = 100.0
            prev_apix = 99.85
            for i in range(29, -1, -1):
                calc_date = today - timedelta(days=i)
                daily_drift = (29 - i) * 0.16 + random.uniform(-0.15, 0.25)
                current_apix = round(base_apix + daily_drift, 2)
                dod_change = round(((current_apix - prev_apix) / prev_apix) * 100, 2)
                prev_apix = current_apix
                
                idx_rec = AirfareIndexRecord(
                    calculation_date=calc_date,
                    frequency="DAILY",
                    formula_type="LASPEYRES",
                    advance_window="ALL_WEIGHTED",
                    index_value=current_apix,
                    base_period="2024-Q1",
                    change_pct_d1=dod_change,
                    change_pct_m1=round(current_apix - 100.0, 2),
                    total_quotes_used=random.randint(480, 560),
                    outliers_excluded=random.randint(4, 12),
                    average_fare=round(6200.0 + (daily_drift * 35.0), 2)
                )
                index_records.append(idx_rec)
            db.bulk_save_objects(index_records)
            db.commit()
            print(f"[OK] Created {len(index_records)} APIx daily index records (30-day series).")

        print("[SUCCESS] Step 1 Database & Route Basket setup completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

