import sys
import random
import hashlib
from datetime import datetime, timezone, timedelta, date

# Enforce UTF-8 stdout if supported
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

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

        # 3. Seed Baseline Time-Series Price Quotes
        print("[3/5] Seeding Baseline Price Quotes across T+1, T+7, T+15, T+30, T+45 windows...")
        existing_quotes_count = db.query(PriceQuote).count()
        
        if existing_quotes_count == 0:
            active_airlines = [a for a in airline_map.values() if a.type == "AIRLINE"]
            now_utc = datetime.now(timezone.utc)
            quotes_to_add = []
            
            # Generate quotes for the last 7 days up to today
            for days_ago in range(7, -1, -1):
                scrape_time = now_utc - timedelta(days=days_ago)
                current_date = scrape_time.date()
                
                for route_code, route in route_map.items():
                    base_distance_fare = route.distance_km * BASE_RATE_PER_KM
                    
                    for window, advance_days in WINDOW_DAYS_MAP.items():
                        flight_date = current_date + timedelta(days=advance_days)
                        surge = WINDOW_SURGE_MULTIPLIER[window]
                        
                        for airline in active_airlines:
                            for flight_seq in [1, 2]:
                                flight_num = f"{airline.code}-{random.randint(100, 999)}"
                                dep_hour = random.choice([6, 8, 11, 14, 17, 20])
                                dep_min = random.choice([0, 15, 30, 45])
                                dep_str = f"{dep_hour:02d}:{dep_min:02d}"
                                duration = int(route.distance_km / 12) + 30
                                arr_minutes = dep_hour * 60 + dep_min + duration
                                arr_str = f"{(arr_minutes // 60) % 24:02d}:{arr_minutes % 60:02d}"

                                rand_factor = random.uniform(0.92, 1.12)
                                raw_base = round(base_distance_fare * surge * rand_factor, 2)
                                
                                taxes = round(raw_base * random.uniform(0.18, 0.22) + 450.0, 2)
                                total_fare = round(raw_base + taxes, 2)
                                
                                # Outlier simulation: 2.5% chance of dynamic surge in T+1
                                is_outlier = False
                                cleaned_fare = total_fare
                                if window == "T+1" and random.random() < 0.025:
                                    is_outlier = True
                                    total_fare = round(total_fare * 3.5, 2)
                                    cleaned_fare = round(total_fare / 3.5, 2)

                                raw_payload = f"{scrape_time.isoformat()}|{flight_num}|{route.route_code}|{total_fare}"
                                snapshot_hash = hashlib.sha256(raw_payload.encode()).hexdigest()

                                quote = PriceQuote(
                                    route_id=route.id,
                                    airline_id=airline.id,
                                    scraped_at=scrape_time,
                                    flight_date=flight_date,
                                    advance_window=window,
                                    flight_number=flight_num,
                                    departure_time=dep_str,
                                    arrival_time=arr_str,
                                    duration_mins=duration,
                                    stops=0,
                                    cabin_class="Economy",
                                    fare_type="Standard",
                                    base_fare=raw_base,
                                    taxes_and_fees=taxes,
                                    total_fare=total_fare,
                                    seats_remaining=random.randint(1, 9),
                                    is_outlier=is_outlier,
                                    cleaned_fare=cleaned_fare,
                                    snapshot_hash=snapshot_hash,
                                    source_url=f"{airline.base_url}/search?from={route.origin_code}&to={route.destination_code}&date={flight_date}"
                                )
                                quotes_to_add.append(quote)

            db.bulk_save_objects(quotes_to_add)
            db.commit()
            print(f"[OK] Created {len(quotes_to_add)} baseline price quotes.")
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

        # 5. Seed Initial Airfare Price Index (APIx) Records
        print("[5/5] Calculating & Seeding Initial APIx Macro Index Records...")
        if db.query(AirfareIndexRecord).count() == 0:
            index_records = []
            today = date.today()
            base_apix = 100.0
            for i in range(14, -1, -1):
                calc_date = today - timedelta(days=i)
                daily_drift = (14 - i) * 0.35 + random.uniform(-0.2, 0.4)
                current_apix = round(base_apix + daily_drift, 2)
                dod_change = round(random.uniform(-0.15, 0.45), 2)
                
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
                    average_fare=round(6200.0 + (daily_drift * 45.0), 2)
                )
                index_records.append(idx_rec)
            db.bulk_save_objects(index_records)
            db.commit()
            print(f"[OK] Created {len(index_records)} APIx daily index records.")

        print("[SUCCESS] Step 1 Database & Route Basket setup completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

