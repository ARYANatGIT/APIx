"""
Data Ingestion Service for Scraper Engine.
Provides high-performance batch insertion of scraped flight quotes,
automatic snapshot SHA-256 hashing for auditability, and crawler health logging.
"""

import hashlib
from datetime import datetime, timezone, date
from pathlib import Path
from sqlalchemy.orm import Session

from backend.config import SNAPSHOTS_DIR
from backend.database import SessionLocal
from backend.models import Route, Airline, PriceQuote, ScraperAuditLog


def ingest_scraper_batch(
    route_code: str,
    airline_code: str,
    quotes: list[dict],
    crawler_status: str = "SUCCESS",
    http_status: int = 200,
    latency_ms: int = 0,
    proxy_ip: str | None = None,
    user_agent: str | None = None,
    error_message: str | None = None,
    raw_payload: str | None = None,
    db: Session | None = None,
) -> dict:
    """
    Uploads scraped flight price quotes and records a crawler audit log in a single transaction.

    Args:
        route_code: e.g. "DEL-BOM"
        airline_code: e.g. "6E" or "MMT"
        quotes: List of flight dictionaries extracted by the scraper
        crawler_status: "SUCCESS", "BLOCKED_CLOUDFLARE", "CAPTCHA_TRIGGERED", "TIMEOUT", "ERROR"
        http_status: HTTP response code (e.g. 200, 403, 429)
        latency_ms: Scraper request duration in milliseconds
        proxy_ip: IP address of the proxy used
        user_agent: User-Agent string used
        error_message: Error details if scraper failed
        raw_payload: Raw HTML or JSON string from the site for audit proof
        db: Optional existing SQLAlchemy session
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Resolve Route & Airline FK IDs
        route = db.query(Route).filter_by(route_code=route_code).first()
        if not route:
            raise ValueError(
                f"Route '{route_code}' not found in database. Must be one of the DGCA basket corridors."
            )

        airline = db.query(Airline).filter_by(code=airline_code).first()
        if not airline:
            raise ValueError(
                f"Airline/OTA code '{airline_code}' not found in database."
            )

        now_utc = datetime.now(timezone.utc)
        snapshot_hash = None
        snapshot_path = None

        # 2. Save Raw Snapshot & Compute SHA-256 for Proof of Source
        if raw_payload:
            snapshot_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
            file_name = f"{now_utc.strftime('%Y%m%d_%H%M%S')}_{airline_code}_{route_code}_{snapshot_hash[:8]}.txt"
            target_path = SNAPSHOTS_DIR / file_name
            target_path.write_text(raw_payload, encoding="utf-8")
            snapshot_path = str(target_path.relative_to(SNAPSHOTS_DIR.parent.parent))

        # 3. Create PriceQuote Objects
        quote_objects = []
        for q in quotes:
            # Parse flight_date if passed as string
            f_date = q["flight_date"]
            if isinstance(f_date, str):
                f_date = date.fromisoformat(f_date)

            total_fare = float(q["total_fare"])
            base_fare = float(q.get("base_fare", total_fare * 0.80))
            taxes_and_fees = float(q.get("taxes_and_fees", total_fare - base_fare))

            # Resolve specific airline if specified in quote, otherwise fallback to batch airline
            q_airline_id = airline.id
            if q.get("airline_code"):
                sub_airline = (
                    db.query(Airline).filter_by(code=q["airline_code"]).first()
                )
                if sub_airline:
                    q_airline_id = sub_airline.id

            quote_obj = PriceQuote(
                route_id=route.id,
                airline_id=q_airline_id,
                scraped_at=now_utc,
                flight_date=f_date,
                advance_window=q.get("advance_window", "T+7"),
                flight_number=q["flight_number"],
                departure_time=q["departure_time"],
                arrival_time=q["arrival_time"],
                duration_mins=int(q.get("duration_mins", 120)),
                stops=int(q.get("stops", 0)),
                cabin_class=q.get("cabin_class", "Economy"),
                fare_type=q.get("fare_type", "Standard"),
                base_fare=base_fare,
                taxes_and_fees=taxes_and_fees,
                total_fare=total_fare,
                seats_remaining=q.get("seats_remaining"),
                is_outlier=False,
                cleaned_fare=total_fare,
                snapshot_hash=snapshot_hash,
                snapshot_path=snapshot_path,
                source_url=q.get("source_url"),
            )
            quote_objects.append(quote_obj)

        if quote_objects:
            db.bulk_save_objects(quote_objects)

        # 4. Record Scraper Audit Log (Crawler Health)
        audit_log = ScraperAuditLog(
            airline_id=airline.id,
            route_code=route_code,
            status=crawler_status,
            http_status=http_status,
            latency_ms=latency_ms,
            quotes_extracted=len(quote_objects),
            proxy_ip=proxy_ip,
            user_agent=user_agent,
            error_message=error_message,
            timestamp=now_utc,
        )
        db.add(audit_log)
        db.commit()

        return {
            "status": "SUCCESS",
            "route_code": route_code,
            "airline_code": airline_code,
            "quotes_saved": len(quote_objects),
            "snapshot_hash": snapshot_hash,
            "timestamp": now_utc.isoformat(),
        }

    except Exception as e:
        db.rollback()
        raise e
    finally:
        if should_close:
            db.close()
