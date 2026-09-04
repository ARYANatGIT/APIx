import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SNAPSHOTS_DIR = DATA_DIR / "snapshots"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "MoSPI Real-time Airfare Price Index (APIx)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: SQLite by default for instant local setup; configurable for PostgreSQL / TimescaleDB
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DATA_DIR / 'apix_mospi.db'}"
    )
    
    # Statistical Index Parameters
    BASE_INDEX_VALUE: float = 100.0
    BASE_PERIOD_LABEL: str = "2024-Q1"
    
    # Advance Purchase Windows monitored by MoSPI
    ADVANCE_WINDOWS: list[str] = ["T+1", "T+7", "T+15", "T+30", "T+45"]
    
    # Outlier detection parameters (Interquartile Range multiplier)
    IQR_MULTIPLIER: float = 1.5

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

