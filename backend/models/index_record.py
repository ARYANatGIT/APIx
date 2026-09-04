from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Index
from backend.database import Base


class AirfareIndexRecord(Base):
    __tablename__ = "airfare_index_records"

    id = Column(Integer, primary_key=True, index=True)
    calculation_date = Column(Date, nullable=False, index=True)
    frequency = Column(String(10), default="DAILY", nullable=False)    # DAILY, WEEKLY, MONTHLY
    formula_type = Column(String(30), default="LASPEYRES", nullable=False) # LASPEYRES, GEOMETRIC_YOUNG, PAASCHE
    advance_window = Column(String(20), default="ALL_WEIGHTED", nullable=False) # T+1, T+7, T+15, T+30, T+45, ALL_WEIGHTED
    
    # Official Index Metric (Base 100.0)
    index_value = Column(Float, nullable=False)
    base_period = Column(String(20), default="2024-Q1", nullable=False)
    
    # Inflation tracking metrics
    change_pct_d1 = Column(Float, nullable=True) # Day-over-day inflation rate
    change_pct_m1 = Column(Float, nullable=True) # Month-over-month inflation rate
    
    # Mathematical & Statistical Metadata
    total_quotes_used = Column(Integer, nullable=False)
    outliers_excluded = Column(Integer, default=0, nullable=False)
    average_fare = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_apix_date_freq_window", "calculation_date", "frequency", "advance_window"),
    )

    def __repr__(self):
        return f"<AirfareIndexRecord {self.calculation_date} {self.frequency} APIx={self.index_value:.2f}>"

