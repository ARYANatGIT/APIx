from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base


class Airline(Base):
    __tablename__ = "airlines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)  # "6E", "AI", "IX", "QP", "SG", "MMT", "EMT"
    name = Column(String(100), nullable=False)                         # "IndiGo", "Air India", "MakeMyTrip"
    type = Column(String(20), default="AIRLINE", nullable=False)       # "AIRLINE" or "OTA"
    base_url = Column(String(255), nullable=False)
    logo_url = Column(String(255), nullable=True)
    color_hex = Column(String(7), default="#1E3A8A", nullable=False)   # UI brand hex code
    market_share_pct = Column(Float, nullable=True)                    # DGCA domestic passenger market share
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    price_quotes = relationship("PriceQuote", back_populates="airline", cascade="all, delete-orphan")
    scraper_logs = relationship("ScraperAuditLog", back_populates="airline", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Airline {self.code}: {self.name} ({self.type})>"

