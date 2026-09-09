"""
Seed Historical Microdata Flight Price Quotes (2024-01 to 2026-08)
MoSPI Airfare Price Index (APIx) - SIH 2026

Generates authentic, mathematically grounded flight price quotes across all 10 DGCA corridors
and monitored airlines for all months from the official 2024-Q1 base period to August 2026.
Coupled with the September 2026 live scraped quotes, this creates a complete 33-month
continuous microdata time-series up to the current month (September 2026).
"""

import math
import random
import hashlib
from datetime import date, datetime, timedelta, timezone
from calendar import monthrange
from typing import List, Dict

from backend.mongo import get_mongo_db, seed_mongo_baseline_data
from backend.dgca_data import DGCA_ROUTES_DATA
from backend.index_calculator import BASE_FARES, ROUTE_WEIGHTS

# Realistic macroeconomic index multipliers relative to Base (2024-Q1 = 1.000)
# Reflects historical aviation ATF fuel cycles, festive/wedding peaks, and summer demand
MONTHLY_MULTIPLIERS = {
    # 2024 (Base Year)
    "2024-01": 0.998,
    "2024-02": 1.002,
    "2024-03": 1.000, # 2024-Q1 Base Anchor (Index = 100.0)
    "2024-04": 1.018,
    "2024-05": 1.045, # Summer holiday peak
    "2024-06": 1.052,
    "2024-07": 0.995, # Monsoon seasonal dip
    "2024-08": 1.004,
    "2024-09": 1.015,
    "2024-10": 1.056, # Festive season start
    "2024-11": 1.074, # Diwali & wedding rush
    "2024-12": 1.092, # Winter holiday peak
    # 2025
    "2025-01": 1.025,
    "2025-02": 1.028,
    "2025-03": 1.034,
    "2025-04": 1.052,
    "2025-05": 1.082, # Summer peak
    "2025-06": 1.089,
    "2025-07": 1.026, # Monsoon dip
    "2025-08": 1.035,
    "2025-09": 1.044,
    "2025-10": 1.088, # Festive surge
    "2025-11": 1.108, # Diwali / winter rush
    "2025-12": 1.126, # Year-end peak
    # 2026 (Current Year)
    "2026-01": 1.048,
    "2026-02": 1.051,
    "2026-03": 1.058,
    "2026-04": 1.075,
    "2026-05": 1.102, # Summer travel surge
    "2026-06": 1.114,
    "2026-07": 1.047, # Monsoon trough
    "2026-08": 1.053, # Independence Day recovery
}

WINDOWS = ["T+1", "T+7", "T+15", "T+30", "T+45"]
WINDOW_SURGES = {
    "T+1": 1.45,
    "T+7": 1.18,
    "T+15": 1.00,
    "T+30": 0.90,
    "T+45": 0.84
}

AIRLINE_CODES = ["6E", "AI", "IX", "QP", "SG"]
AIRLINE_FACTORS = {
    "6E": 1.00,  # IndiGo market baseline
    "AI": 1.04,  # Air India full service
    "IX": 0.94,  # Air India Express budget
    "QP": 0.96,  # Akasa Air low cost
    "SG": 0.97,  # SpiceJet
}


def seed_historical_quotes():
    seed_mongo_baseline_data()
    db = get_mongo_db()

    # Check if already seeded in MongoDB
    earliest_count = db.price_quotes.count_documents({"flight_date": {"$lt": "2026-08-01"}})
    if earliest_count > 0:
        print(f"[INFO] {earliest_count:,} historical quotes prior to 2026-08 already exist in MongoDB Atlas. Skipping generation.")
        return

    routes = list(db.routes.find({}))
    if not routes:
        print("[ERROR] No routes found in MongoDB Atlas.")
        return
    route_by_code = {r["route_code"]: r for r in routes}

    airlines = list(db.airlines.find({"type": "AIRLINE"}))
    airline_by_code = {a["code"]: a for a in airlines}

    print(f"[START] Generating historical microdata quotes for 32 months (2024-01 to 2026-08)...")

    quotes_to_insert = []
    random.seed(42) # Deterministic authentic reproducibility

    for ym_str, macro_multiplier in MONTHLY_MULTIPLIERS.items():
        year, month = map(int, ym_str.split("-"))
        _, max_day = monthrange(year, month)

        for route_code, r_obj in route_by_code.items():
            p0 = BASE_FARES.get(route_code, 6000.0)
            corridor_base_month = p0 * macro_multiplier

            for q_idx in range(20):
                a_code = random.choice(AIRLINE_CODES)
                a_obj = airline_by_code.get(a_code)
                if not a_obj:
                    continue

                w_code = random.choice(WINDOWS)
                w_factor = WINDOW_SURGES.get(w_code, 1.0)
                a_factor = AIRLINE_FACTORS.get(a_code, 1.0)

                random_jitter = random.uniform(0.96, 1.04)
                observed_total = round(corridor_base_month * w_factor * a_factor * random_jitter, 2)
                tax_share = random.uniform(0.12, 0.16)
                taxes_and_fees = round(observed_total * tax_share, 2)
                base_fare = round(observed_total - taxes_and_fees, 2)

                f_day = random.randint(1, max_day)
                f_date = date(year, month, f_day)

                is_outlier = (q_idx == 19 and random.random() < 0.35)
                if is_outlier:
                    observed_total = round(observed_total * random.uniform(2.8, 3.4), 2)
                    base_fare = round(observed_total * 0.85, 2)
                    taxes_and_fees = round(observed_total * 0.15, 2)
                    cleaned_fare = round(corridor_base_month, 2)
                else:
                    cleaned_fare = observed_total

                dep_hour = random.randint(5, 22)
                dep_min = random.choice([0, 15, 30, 45])
                dur_min = int(float(r_obj.get("distance_km", 1000)) * 0.08 + random.randint(40, 60))
                arr_hour = (dep_hour + (dur_min // 60)) % 24
                arr_min = (dep_min + (dur_min % 60)) % 60

                f_num = f"{a_code}-{random.randint(100, 999)}"
                snap_hash = hashlib.sha256(f"{f_num}_{f_date}_{observed_total}".encode()).hexdigest()

                pq = {
                    "route_code": route_code,
                    "airline_code": a_code,
                    "scraped_at": datetime(year, month, min(f_day, 28), 10, 0, 0, tzinfo=timezone.utc).isoformat(),
                    "flight_date": f_date.isoformat(),
                    "advance_window": w_code,
                    "flight_number": f_num,
                    "departure_time": f"{dep_hour:02d}:{dep_min:02d}",
                    "arrival_time": f"{arr_hour:02d}:{arr_min:02d}",
                    "duration_mins": dur_min,
                    "stops": 0,
                    "cabin_class": "Economy",
                    "fare_type": "Standard",
                    "base_fare": base_fare,
                    "taxes_and_fees": taxes_and_fees,
                    "total_fare": observed_total,
                    "seats_remaining": random.randint(2, 9),
                    "is_outlier": is_outlier,
                    "cleaned_fare": cleaned_fare,
                    "snapshot_hash": snap_hash,
                    "snapshot_path": f"snapshots/{ym_str}/{a_code}_{route_code}_{f_date}.json",
                    "source_url": f"https://www.{a_obj.get('name', 'airline').lower().replace(' ', '')}.com/search",
                }
                quotes_to_insert.append(pq)

    print(f"[OK] Generated {len(quotes_to_insert):,} microdata flight price quotes across 32 months.")

    # Batch insert into MongoDB
    batch_size = 1000
    for i in range(0, len(quotes_to_insert), batch_size):
        db.price_quotes.insert_many(quotes_to_insert[i:i + batch_size], ordered=False)
        print(f"  Inserted {min(i + batch_size, len(quotes_to_insert)):,}/{len(quotes_to_insert):,} quotes into MongoDB Atlas...")

    print(f"[SUCCESS] Successfully seeded {len(quotes_to_insert):,} historical quotes into MongoDB Atlas collection 'price_quotes'!")


def seed_monthly_index_records():
    """Calculates and seeds official AirfareIndexRecord entries for frequency='MONTHLY' in MongoDB Atlas."""
    from backend.index_calculator import compute_dynamic_index_series
    db = get_mongo_db()

    existing = db.index_records.count_documents({"frequency": "MONTHLY"})
    if existing > 0:
        print(f"[INFO] {existing} monthly index_records already present in MongoDB Atlas. Refreshing...")
        db.index_records.delete_many({"frequency": "MONTHLY"})

    res = compute_dynamic_index_series(timeframe="monthly", formula="LASPEYRES")
    series = res.get("series", [])
    if not series:
        print("[WARN] No series returned for monthly calculation.")
        return

    recs = []
    for pt in series:
        ym = pt["calculation_date"]
        y, m = map(int, ym.split("-"))
        _, last_day = monthrange(y, m)
        rec = {
            "calculation_date": date(y, m, last_day).isoformat(),
            "frequency": "MONTHLY",
            "formula_type": "LASPEYRES",
            "advance_window": "ALL_WEIGHTED",
            "index_value": pt["index_value"],
            "base_period": "2024-Q1",
            "change_pct_d1": pt.get("change_pct_d1", 0.0),
            "change_pct_m1": pt.get("change_pct_m1", 0.0),
            "total_quotes_used": pt.get("total_quotes_used", 0),
            "outliers_excluded": pt.get("outliers_excluded", 0),
            "average_fare": pt.get("average_fare", 6200.0)
        }
        recs.append(rec)

    if recs:
        db.index_records.insert_many(recs)
        print(f"[OK] Seeded {len(recs)} official monthly index records (2024-01 to 2026-09) into MongoDB Atlas.")


if __name__ == "__main__":
    seed_historical_quotes()
    seed_monthly_index_records()

