"""
Interactive Database Viewer & Inspector for MoSPI Airfare Price Index (APIx).
Allows viewing database schema, table statistics, and live stored records.
"""

import argparse
import sqlite3
import sys
from pathlib import Path
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DB_PATH = Path(__file__).resolve().parent / "data" / "apix_mospi.db"


def get_connection():
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found at: {DB_PATH}")
        sys.exit(1)
    return sqlite3.connect(DB_PATH)


def show_overview():
    conn = get_connection()
    c = conn.cursor()
    print("=" * 85)
    print(f"MoSPI APIx DATABASE OVERVIEW: {DB_PATH}")
    print("=" * 85)

    tables = [
        r[0]
        for r in c.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
    ]

    table_data = []
    for t in tables:
        count = c.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        col_count = len(c.execute(f"PRAGMA table_info({t})").fetchall())
        table_data.append(
            {"Table Name": t, "Total Records": f"{count:,}", "Total Columns": col_count}
        )

    df = pd.DataFrame(table_data)
    print(df.to_string(index=False))
    print("=" * 85)
    conn.close()


def show_schema(table_name=None):
    conn = get_connection()
    c = conn.cursor()

    if table_name:
        tables = [table_name]
    else:
        tables = [
            r[0]
            for r in c.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            ).fetchall()
        ]

    for t in tables:
        print(f"\n>>> SCHEMA FOR TABLE: {t.upper()}")
        print("-" * 85)
        columns = c.execute(f"PRAGMA table_info({t})").fetchall()
        col_list = []
        for col in columns:
            cid, name, col_type, notnull, dflt_value, pk = col
            col_list.append(
                {
                    "Col #": cid,
                    "Column Name": name,
                    "Data Type": col_type,
                    "Nullable": "NO" if notnull else "YES",
                    "Default": dflt_value if dflt_value is not None else "",
                    "PK": "YES" if pk else "",
                }
            )
        print(pd.DataFrame(col_list).to_string(index=False))
    conn.close()


def show_table_data(table_name, limit=15, route=None, carrier=None, window=None):
    conn = get_connection()

    if table_name == "price_quotes":
        query = """
            SELECT 
                p.id,
                r.route_code AS route,
                a.code AS carrier,
                p.flight_number,
                p.flight_date,
                p.advance_window AS window,
                p.departure_time AS dept,
                p.arrival_time AS arr,
                p.duration_mins AS dur_mins,
                p.stops,
                p.base_fare,
                p.taxes_and_fees AS taxes,
                p.total_fare,
                p.scraped_at
            FROM price_quotes p
            JOIN routes r ON p.route_id = r.id
            JOIN airlines a ON p.airline_id = a.id
            WHERE 1=1
        """
        params = []
        if route:
            query += " AND r.route_code = ?"
            params.append(route)
        if carrier:
            query += " AND a.code = ?"
            params.append(carrier)
        if window:
            query += " AND p.advance_window = ?"
            params.append(window)

        query += f" ORDER BY p.id DESC LIMIT {limit}"
        df = pd.read_sql_query(query, conn, params=params)
    else:
        query = f"SELECT * FROM {table_name} ORDER BY 1 DESC LIMIT {limit}"
        df = pd.read_sql_query(query, conn)

    print("=" * 85)
    print(f"LIVE DATA: {table_name.upper()} (Showing up to {limit} records)")
    print("=" * 85)
    if df.empty:
        print("No matching records found.")
    else:
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", 1000)
        print(df.to_string(index=False))
    print("=" * 85)
    conn.close()


def run_custom_query(sql):
    conn = get_connection()
    try:
        df = pd.read_sql_query(sql, conn)
        print("=" * 85)
        print(f"QUERY: {sql}")
        print("=" * 85)
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", 1000)
        print(df.to_string(index=False))
        print(f"\nTotal rows returned: {len(df)}")
        print("=" * 85)
    except Exception as e:
        print(f"[ERROR] Query failed: {e}")
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="View MoSPI APIx SQLite Database")
    parser.add_argument("--overview", action="store_true", help="Show table counts overview")
    parser.add_argument("--schema", action="store_true", help="Show database table schema")
    parser.add_argument("--table", type=str, help="Table name to inspect (e.g. price_quotes, routes, airlines)")
    parser.add_argument("--limit", type=int, default=15, help="Maximum rows to display (default: 15)")
    parser.add_argument("--route", type=str, help="Filter price_quotes by route code (e.g. DEL-BOM)")
    parser.add_argument("--carrier", type=str, help="Filter price_quotes by airline code (e.g. 6E, AI)")
    parser.add_argument("--window", type=str, help="Filter price_quotes by advance window (e.g. T+0, T+7)")
    parser.add_argument("--query", type=str, help="Execute arbitrary SQL query")

    args = parser.parse_args()

    if args.query:
        run_custom_query(args.query)
    elif args.table:
        if args.schema:
            show_schema(args.table)
        show_table_data(args.table, limit=args.limit, route=args.route, carrier=args.carrier, window=args.window)
    elif args.schema:
        show_schema()
    else:
        show_overview()
        print("\nQuick Usage Examples:")
        print("  python view_database.py --schema                         # View full schema of all tables")
        print("  python view_database.py --table price_quotes             # View latest price quotes")
        print("  python view_database.py --table routes                   # View 10 DGCA corridors")
        print("  python view_database.py --table airlines                 # View registered airlines")
        print("  python view_database.py --table price_quotes --carrier 6E --route DEL-BOM --window T+7")
        print('  python view_database.py --query "SELECT advance_window, count(*), round(avg(total_fare),2) FROM price_quotes GROUP BY advance_window"')


if __name__ == "__main__":
    main()

