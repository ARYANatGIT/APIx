from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base


class ScraperAuditLog(Base):
    __tablename__ = "scraper_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    airline_id = Column(Integer, ForeignKey("airlines.id", ondelete="CASCADE"), nullable=True, index=True)
    route_code = Column(String(10), nullable=True, index=True)
    
    # Crawler Execution Metrics
    status = Column(String(30), nullable=False, index=True)  # SUCCESS, BLOCKED_CLOUDFLARE, CAPTCHA_TRIGGERED, TIMEOUT
    http_status = Column(Integer, nullable=True)             # 200, 403, 429, 500, etc.
    latency_ms = Column(Integer, nullable=False)             # Scraper execution round-trip latency
    quotes_extracted = Column(Integer, default=0, nullable=False)
    
    # Anti-Bot Resilience Tracking
    proxy_ip = Column(String(50), nullable=True)             # Obfuscated / rotating proxy IP
    user_agent = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    airline = relationship("Airline", back_populates="scraper_logs")

    def __repr__(self):
        return f"<ScraperAuditLog {self.route_code} {self.status} {self.quotes_extracted} quotes>"

