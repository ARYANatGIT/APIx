import io
import csv
import json
import zipfile
from datetime import datetime, timezone
from typing import Dict, Any, List

from backend.mongo import get_mongo_db


def export_quotes_to_csv(db=None) -> str:
    """Generates a full CSV string of all price quotes in MongoDB."""
    if db is None:
        db = get_mongo_db()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header columns
    writer.writerow([
        "quote_id",
        "route_code",
        "route_name",
        "airline",
        "airline_code",
        "flight_number",
        "departure_time",
        "arrival_time",
        "total_fare_inr",
        "base_fare_inr",
        "taxes_fees_inr",
        "advance_window",
        "flight_date",
        "scraped_at",
        "source_portal",
        "cabin_class",
        "is_outlier",
        "cryptographic_hash"
    ])

    quotes = db.price_quotes.find({}, {"_id": 0}).sort("flight_date", 1)
    for q in quotes:
        writer.writerow([
            q.get("quote_id", ""),
            q.get("route", q.get("route_code", "")),
            q.get("route_name", ""),
            q.get("airline", ""),
            q.get("airline_code", ""),
            q.get("flight_number", ""),
            q.get("departure_time", ""),
            q.get("arrival_time", ""),
            q.get("total_fare", 0),
            q.get("base_fare", 0),
            q.get("taxes_fees", 0),
            q.get("advance_window", ""),
            q.get("flight_date", ""),
            q.get("scraped_at", ""),
            q.get("source", "AirSetu Direct Scraper"),
            q.get("cabin_class", "Economy"),
            q.get("is_outlier", False),
            q.get("sha256_hash", "")
        ])

    return output.getvalue()


def export_quotes_to_json(db=None) -> Dict[str, Any]:
    """Returns complete price quotes dataset as a structured dictionary."""
    if db is None:
        db = get_mongo_db()

    quotes = list(db.price_quotes.find({}, {"_id": 0}).sort("flight_date", 1))
    return {
        "metadata": {
            "dataset_name": "AirSetu Complete Aviation Price Quotes Corpus",
            "curator": "Ministry of Statistics and Programme Implementation (MoSPI)",
            "total_records": len(quotes),
            "base_period": "2024-Q1",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "monitored_carriers": ["IndiGo", "Air India", "Akasa Air", "SpiceJet", "Air India Express"],
            "license": "Government Open Data Access (MoSPI CPI Augmentation Suite)"
        },
        "quotes": quotes
    }


def export_apix_timeseries_to_csv(db=None) -> str:
    """Generates full CSV of historical APIx index records."""
    if db is None:
        db = get_mongo_db()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "calculation_date",
        "frequency",
        "formula",
        "advance_window",
        "apix_index_value",
        "base_period",
        "base_value",
        "dod_change_pct",
        "mom_change_pct",
        "weighted_avg_fare_inr",
        "calculated_at"
    ])

    records = db.index_records.find({}, {"_id": 0}).sort("calculation_date", 1)
    for r in records:
        writer.writerow([
            r.get("calculation_date", ""),
            r.get("frequency", "DAILY"),
            r.get("formula", "LASPEYRES_FIXED_BASE"),
            r.get("advance_window", "ALL_WEIGHTED"),
            r.get("index_value", 100.0),
            r.get("base_period", "2024-Q1"),
            100.0,
            r.get("change_pct_d1", 0.0),
            r.get("change_pct_m1", 0.0),
            r.get("average_fare", 0.0),
            r.get("calculated_at", "")
        ])

    return output.getvalue()


def export_route_basket_to_csv(db=None) -> str:
    """Generates CSV of 10 DGCA domestic flight corridors and weights."""
    if db is None:
        db = get_mongo_db()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "route_code",
        "origin_city",
        "origin_airport",
        "destination_city",
        "destination_airport",
        "annual_passengers_millions",
        "laspeyres_weight_pct",
        "base_price_p0_inr",
        "tier"
    ])

    routes = db.routes.find({}, {"_id": 0}).sort("weight", -1)
    for r in routes:
        writer.writerow([
            r.get("route_code", ""),
            r.get("origin_city", ""),
            r.get("origin_code", ""),
            r.get("destination_city", ""),
            r.get("destination_code", ""),
            r.get("annual_passengers", 0),
            r.get("weight", 0.0),
            r.get("base_price", 0.0),
            r.get("tier", "METRO_TRUNK")
        ])

    return output.getvalue()


def export_intel_alerts_to_json(db=None) -> Dict[str, Any]:
    """Returns all stored real-time news disruptions, scraper spikes, and ML forecasts."""
    if db is None:
        db = get_mongo_db()

    alerts = list(db.intel_alerts.find({}, {"_id": 0}).sort("timestamp", -1))
    return {
        "metadata": {
            "dataset_name": "AirSetu Air Intel Disruption & Scraper Spike Events",
            "total_alerts": len(alerts),
            "exported_at": datetime.now(timezone.utc).isoformat()
        },
        "alerts": alerts
    }


def generate_master_zip_archive(db=None) -> bytes:
    """
    Creates an in-memory ZIP file containing all 6 core datasets
    plus an official README data dictionary for researchers.
    """
    if db is None:
        db = get_mongo_db()

    quotes_csv = export_quotes_to_csv(db)
    quotes_json_obj = export_quotes_to_json(db)
    apix_csv = export_apix_timeseries_to_csv(db)
    routes_csv = export_route_basket_to_csv(db)
    intel_json_obj = export_intel_alerts_to_json(db)

    now_iso = datetime.now(timezone.utc).isoformat()
    now_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    readme_content = f"""# AirSetu • MoSPI Real-time Airfare Price Index (APIx)
## Official Open Research Dataset Package (Archive Release {now_date})

### Overview
This dataset archive provides high-frequency airfare microdata and the official Laspeyres
Airfare Price Index (APIx) maintained under the Ministry of Statistics and Programme
Implementation (MoSPI) and utilized by the Reserve Bank of India (RBI) Monetary Policy Desk.

---

### Archive Contents
1. `airsetu_microdata_quotes.csv`
   - Complete high-frequency retail airfare quotes ({len(quotes_json_obj['quotes']):,} records).
   - Scraped across 7 domestic carriers (IndiGo, Air India, Akasa Air, SpiceJet, Air India Express)
     and 10 DGCA top-traffic domestic corridors across advance purchase windows (T+0 through T+45).

2. `airsetu_microdata_quotes.json`
   - Full JSON document representation of all microdata quotes with metadata headers.

3. `airsetu_apix_timeseries.csv`
   - Official daily Laspeyres Airfare Price Index series (Base 2024-Q1 = 100.0).
   - Includes DoD inflation changes, MoM changes, and weighted average economy fares.

4. `airsetu_dgca_route_basket.csv`
   - DGCA top 10 domestic corridors, base prices ($P_0$), annual passenger volumes ($Q_0$),
     and normalized expenditure weights ($W_i$).

5. `airsetu_intel_disruptions_spikes.json`
   - Real-time aviation disruption intelligence events (weather, floods, fog) and statistical
     scraper price spike anomalies detected against rolling baseline means.

---

### Mathematical Formulation
The Headline APIx is calculated using the Laspeyres Fixed-Base Price Index formula:

    APIx_t = ( \\sum_{{i=1}}^n P_{{it}} \\times Q_{{i0}} ) / ( \\sum_{{i=1}}^n P_{{i0}} \\times Q_{{i0}} ) \\times 100

Where:
- P_{{it}}: Price relative for route i at day t across monitored advance windows.
- P_{{i0}}: Baseline average price for corridor i during base period 2024-Q1.
- Q_{{i0}}: Base period passenger quantity weights sourced from DGCA annual domestic city-pair reports.

---

### Citation & Licensing
Ministry of Statistics and Programme Implementation (MoSPI)
Government of India • AirSetu Real-Time CPI Aviation Suite
Archive Exported: {now_iso}
"""

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("airsetu_microdata_quotes.csv", quotes_csv)
        zf.writestr("airsetu_microdata_quotes.json", json.dumps(quotes_json_obj, indent=2))
        zf.writestr("airsetu_apix_timeseries.csv", apix_csv)
        zf.writestr("airsetu_dgca_route_basket.csv", routes_csv)
        zf.writestr("airsetu_intel_disruptions_spikes.json", json.dumps(intel_json_obj, indent=2))
        zf.writestr("README_DATASET_SPECIFICATION.md", readme_content)

    zip_buffer.seek(0)
    return zip_buffer.getvalue()
