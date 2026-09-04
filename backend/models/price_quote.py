from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, BigInteger, String, Float, Boolean, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.database import Base


class PriceQuote(Base):
    __tablename__ = "price_quotes"

    # SQLite ROWID alias requires Integer primary key; PostgreSQL uses BigInteger
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Foreign keys
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True)
    airline_id = Column(Integer, ForeignKey("airlines.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timing & Booking Horizon
    scraped_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    flight_date = Column(Date, nullable=False, index=True)
    advance_window = Column(String(10), nullable=False, index=True)  # "T+1", "T+7", "T+15", "T+30", "T+45"
    
    # Flight details
    flight_number = Column(String(25), nullable=False)  # e.g., "6E-204"
    departure_time = Column(String(10), nullable=False) # e.g., "07:15"
    arrival_time = Column(String(10), nullable=False)   # e.g., "09:30"
    duration_mins = Column(Integer, nullable=False)     # e.g., 135
    stops = Column(Integer, default=0, nullable=False)  # 0 = Direct flight
    
    # Fare breakdown
    cabin_class = Column(String(30), default="Economy", nullable=False) # Economy, Premium, Business
    fare_type = Column(String(30), default="Standard", nullable=False)  # Saver, Standard, Flexi
    base_fare = Column(Float, nullable=False)
    taxes_and_fees = Column(Float, nullable=False)
    total_fare = Column(Float, nullable=False, index=True)              # Price observed
    seats_remaining = Column(Integer, nullable=True)                    # Seat scarcity indicator
    
    # Statistical Cleaning & Outlier Management for MoSPI Index
    is_outlier = Column(Boolean, default=False, nullable=False, index=True) # Flagged by IQR
    cleaned_fare = Column(Float, nullable=True)                             # Normalised fare used in CPI
    
    # Proof of Source & Government Auditability
    snapshot_hash = Column(String(64), nullable=True) # SHA-256 hash of raw JSON/HTML response
    snapshot_path = Column(String(255), nullable=True) # Storage path to raw scraped file
    source_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    route = relationship("Route", back_populates="price_quotes")
    airline = relationship("Airline", back_populates="price_quotes")

    __table_args__ = (
        Index("ix_price_quotes_route_window", "route_id", "advance_window"),
        Index("ix_price_quotes_route_date", "route_id", "flight_date"),
        Index("ix_price_quotes_scraped_route", "scraped_at", "route_id"),
    )

    def __repr__(self):
        return f"<PriceQuote {self.flight_number} {self.advance_window} INR {self.total_fare}>"

