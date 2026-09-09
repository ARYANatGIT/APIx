"""
Interactive Database Viewer & Inspector for MoSPI Airfare Price Index (APIx).
Inspects live MongoDB Atlas collections, document statistics, schemas, and live records.
"""

import argparse
import sys
from pathlib import Path
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.mongo import get_mongo_db, get_mongo_status
from backend.config import settings


def show_overview():
    status = get_mongo_status()
    db = get_mongo_db()
    print("=" * 85)
    print(f"MoSPI APIx DATABASE OVERVIEW: MongoDB Atlas [{status['database']}]")
    print(f"Connection Status : {status['status'].upper()} (Driver: {status['driver']})")
    print("=" * 85)

    collections = ["routes", "airlines", "price_quotes", "index_records", "scraper_audit_logs"]
    table_data = []
    for cname in collections:
        count = db[cname].count_documents({})
        sample_doc = db[cname].find_one() or {}
        table_data.append({
            "Collection Name": cname,
            "Total Documents": f"{count:,}",
            "Sample Keys": len(sample_doc.keys()),
        })

    df = pd.DataFrame(table_data)
    print(df.to_string(index=False))
    print("=" * 85)


def show_schema(collection_name=None):
    db = get_mongo_db()
    collections = [collection_name] if collection_name else ["routes", "airlines", "price_quotes", "index_records", "scraper_audit_logs"]

    for cname in collections:
        print(f"\n>>> SCHEMA / STRUCTURE FOR COLLECTION: {cname.upper()}")
        print("-" * 85)
        sample_doc = db[cname].find_one()
        if not sample_doc:
            print("  (Empty collection)")
            continue

        field_list = []
        for idx, (k, v) in enumerate(sample_doc.items(), 1):
            if k == "_id":
                v_type = "ObjectId / str"
            else:
                v_type = type(v).__name__
            val_preview = str(v)[:40]
            field_list.append({
                "Field #": idx,
                "Field Name": k,
                "Type": v_type,
                "Example Value": val_preview,
            })
        print(pd.DataFrame(field_list).to_string(index=False))


def show_collection_data(collection_name, limit=15, route=None, carrier=None, window=None):
    db = get_mongo_db()
    query = {}

    if collection_name == "price_quotes":
        if route:
            query["route_code"] = route
        if carrier:
            query["airline_code"] = carrier
        if window:
            query["advance_window"] = window

        docs = list(db[collection_name].find(query).sort("_id", -1).limit(limit))
        cleaned = []
        for d in docs:
            cleaned.append({
                "id": str(d.get("_id"))[-8:],
                "route": d.get("route_code"),
                "carrier": d.get("airline_code"),
                "flight_number": d.get("flight_number"),
                "flight_date": str(d.get("flight_date"))[:10],
                "window": d.get("advance_window"),
                "dept": d.get("departure_time"),
                "arr": d.get("arrival_time"),
                "dur_mins": d.get("duration_mins"),
                "base_fare": d.get("base_fare"),
                "taxes": d.get("taxes_and_fees"),
                "total_fare": d.get("total_fare"),
            })
        df = pd.DataFrame(cleaned)
    else:
        docs = list(db[collection_name].find(query).limit(limit))
        for d in docs:
            if "_id" in d:
                d["_id"] = str(d["_id"])
        df = pd.DataFrame(docs)

    print("=" * 85)
    print(f"LIVE DATA: {collection_name.upper()} (Showing up to {limit} documents)")
    print("=" * 85)
    if df.empty:
        print("No matching records found.")
    else:
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", 1000)
        print(df.to_string(index=False))
    print("=" * 85)


def main():
    parser = argparse.ArgumentParser(description="View MoSPI APIx MongoDB Database")
    parser.add_argument("--overview", action="store_true", help="Show collections overview")
    parser.add_argument("--schema", action="store_true", help="Show database collection schema")
    parser.add_argument("--table", type=str, help="Collection name to inspect (e.g. price_quotes, routes, airlines)")
    parser.add_argument("--limit", type=int, default=15, help="Maximum rows to display (default: 15)")
    parser.add_argument("--route", type=str, help="Filter price_quotes by route code (e.g. DEL-BOM)")
    parser.add_argument("--carrier", type=str, help="Filter price_quotes by airline code (e.g. 6E, AI)")
    parser.add_argument("--window", type=str, help="Filter price_quotes by advance window (e.g. T+0, T+7)")

    args = parser.parse_args()

    if args.table:
        if args.schema:
            show_schema(args.table)
        show_collection_data(args.table, limit=args.limit, route=args.route, carrier=args.carrier, window=args.window)
    elif args.schema:
        show_schema()
    else:
        show_overview()
        print("\nQuick Usage Examples:")
        print("  python view_database.py --schema                         # View schema of all collections")
        print("  python view_database.py --table price_quotes             # View latest price quotes")
        print("  python view_database.py --table routes                   # View 10 DGCA corridors")
        print("  python view_database.py --table airlines                 # View registered airlines")
        print("  python view_database.py --table price_quotes --carrier 6E --route DEL-BOM --window T+7")


if __name__ == "__main__":
    main()


