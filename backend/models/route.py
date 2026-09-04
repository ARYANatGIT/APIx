from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String(10), unique=True, index=True, nullable=False)  # e.g., "DEL-BOM"
    
    # Origin details
    origin_code = Column(String(3), index=True, nullable=False)  # e.g., "DEL"
    origin_city = Column(String(50), nullable=False)             # e.g., "Delhi"
    origin_airport = Column(String(120), nullable=False)          # e.g., "Indira Gandhi International Airport"
    origin_state = Column(String(50), nullable=False)
    origin_lat = Column(Float, nullable=False)                   # e.g., 28.5562
    origin_lon = Column(Float, nullable=False)                   # e.g., 77.1000

    # Destination details
    destination_code = Column(String(3), index=True, nullable=False)  # e.g., "BOM"
    destination_city = Column(String(50), nullable=False)             # e.g., "Mumbai"
    destination_airport = Column(String(120), nullable=False)          # e.g., "Chhatrapati Shivaji Maharaj Intl Airport"
    destination_state = Column(String(50), nullable=False)
    destination_lat = Column(Float, nullable=False)                   # e.g., 19.0896
    destination_lon = Column(Float, nullable=False)                   # e.g., 72.8656

    distance_km = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    weights = relationship("DGCARouteWeight", back_populates="route", cascade="all, delete-orphan")
    price_quotes = relationship("PriceQuote", back_populates="route", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Route {self.route_code}: {self.origin_city} -> {self.destination_city}>"


class DGCARouteWeight(Base):
    __tablename__ = "dgca_route_weights"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True)
    reporting_year = Column(Integer, default=2024, nullable=False)
    annual_passengers = Column(Integer, nullable=False)  # Annual passenger traffic from DGCA statistics
    passenger_share = Column(Float, nullable=False)      # Unnormalized share of total domestic traffic
    weight = Column(Float, nullable=False)               # Normalized Laspeyres basket weight (sum = 1.0)
    is_active = Column(Boolean, default=True, nullable=False)
    source_document = Column(String(150), default="DGCA Domestic Air Traffic Statistics Handbook", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    route = relationship("Route", back_populates="weights")

    def __repr__(self):
        return f"<DGCARouteWeight route_id={self.route_id} weight={self.weight:.4f}>"

