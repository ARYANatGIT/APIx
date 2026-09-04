-- =============================================================================
-- MoSPI Real-time Airfare Price Index (APIx)
-- Production PostgreSQL & TimescaleDB Database Schema
-- SIH Problem Statement: SIH26056
-- =============================================================================

-- Enable UUID and TimescaleDB extensions (if deployed on TimescaleDB)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- -----------------------------------------------------------------------------
-- Table: routes (DGCA Domestic Corridors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_code VARCHAR(10) NOT NULL UNIQUE,
    origin_code VARCHAR(3) NOT NULL,
    origin_city VARCHAR(50) NOT NULL,
    origin_airport VARCHAR(120) NOT NULL,
    origin_state VARCHAR(50) NOT NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lon DOUBLE PRECISION NOT NULL,
    destination_code VARCHAR(3) NOT NULL,
    destination_city VARCHAR(50) NOT NULL,
    destination_airport VARCHAR(120) NOT NULL,
    destination_state VARCHAR(50) NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lon DOUBLE PRECISION NOT NULL,
    distance_km INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_routes_origin_code ON routes (origin_code);
CREATE INDEX IF NOT EXISTS ix_routes_destination_code ON routes (destination_code);
CREATE INDEX IF NOT EXISTS ix_routes_route_code ON routes (route_code);

-- -----------------------------------------------------------------------------
-- Table: dgca_route_weights (Annual Passenger Traffic & Laspeyres Basket Weights)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dgca_route_weights (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    reporting_year INTEGER NOT NULL DEFAULT 2024,
    annual_passengers INTEGER NOT NULL,
    passenger_share DOUBLE PRECISION NOT NULL,
    weight DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    source_document VARCHAR(150) NOT NULL DEFAULT 'DGCA Domestic Air Traffic Statistics Handbook',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dgca_route_weights_route_id ON dgca_route_weights (route_id);

-- -----------------------------------------------------------------------------
-- Table: airlines (Airlines and Online Travel Aggregators)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airlines (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'AIRLINE',
    base_url VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    color_hex VARCHAR(7) NOT NULL DEFAULT '#1E3A8A',
    market_share_pct DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_airlines_code ON airlines (code);

-- -----------------------------------------------------------------------------
-- Table: price_quotes (Time-Series Fare Quotes across T+1, T+7, T+15, T+30, T+45)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_quotes (
    id BIGSERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    airline_id INTEGER NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
    scraped_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    flight_date DATE NOT NULL,
    advance_window VARCHAR(10) NOT NULL,
    flight_number VARCHAR(25) NOT NULL,
    departure_time VARCHAR(10) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    duration_mins INTEGER NOT NULL,
    stops INTEGER NOT NULL DEFAULT 0,
    cabin_class VARCHAR(30) NOT NULL DEFAULT 'Economy',
    fare_type VARCHAR(30) NOT NULL DEFAULT 'Standard',
    base_fare DOUBLE PRECISION NOT NULL,
    taxes_and_fees DOUBLE PRECISION NOT NULL,
    total_fare DOUBLE PRECISION NOT NULL,
    seats_remaining INTEGER,
    is_outlier BOOLEAN NOT NULL DEFAULT FALSE,
    cleaned_fare DOUBLE PRECISION,
    snapshot_hash VARCHAR(64),
    snapshot_path VARCHAR(255),
    source_url VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Fast composite indices for time-series queries
CREATE INDEX IF NOT EXISTS ix_price_quotes_route_window ON price_quotes (route_id, advance_window);
CREATE INDEX IF NOT EXISTS ix_price_quotes_route_date ON price_quotes (route_id, flight_date);
CREATE INDEX IF NOT EXISTS ix_price_quotes_scraped_route ON price_quotes (scraped_at, route_id);
CREATE INDEX IF NOT EXISTS ix_price_quotes_total_fare ON price_quotes (total_fare);
CREATE INDEX IF NOT EXISTS ix_price_quotes_is_outlier ON price_quotes (is_outlier);

-- If deploying on TimescaleDB, convert price_quotes to a Hypertable:
-- SELECT create_hypertable('price_quotes', 'scraped_at', chunk_time_interval => INTERVAL '7 days');

-- -----------------------------------------------------------------------------
-- Table: scraper_audit_logs (Crawler Health, Proxy & Anti-Bot Bypass Auditing)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scraper_audit_logs (
    id SERIAL PRIMARY KEY,
    airline_id INTEGER REFERENCES airlines(id) ON DELETE CASCADE,
    route_code VARCHAR(10),
    status VARCHAR(30) NOT NULL,
    http_status INTEGER,
    latency_ms INTEGER NOT NULL,
    quotes_extracted INTEGER NOT NULL DEFAULT 0,
    proxy_ip VARCHAR(50),
    user_agent VARCHAR(255),
    error_message TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_scraper_audit_status ON scraper_audit_logs (status);
CREATE INDEX IF NOT EXISTS ix_scraper_audit_timestamp ON scraper_audit_logs (timestamp);

-- -----------------------------------------------------------------------------
-- Table: airfare_index_records (Official Macroeconomic APIx Inflation Records)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airfare_index_records (
    id SERIAL PRIMARY KEY,
    calculation_date DATE NOT NULL,
    frequency VARCHAR(10) NOT NULL DEFAULT 'DAILY',
    formula_type VARCHAR(30) NOT NULL DEFAULT 'LASPEYRES',
    advance_window VARCHAR(20) NOT NULL DEFAULT 'ALL_WEIGHTED',
    index_value DOUBLE PRECISION NOT NULL,
    base_period VARCHAR(20) NOT NULL DEFAULT '2024-Q1',
    change_pct_d1 DOUBLE PRECISION,
    change_pct_m1 DOUBLE PRECISION,
    total_quotes_used INTEGER NOT NULL,
    outliers_excluded INTEGER NOT NULL DEFAULT 0,
    average_fare DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_apix_date_freq_window ON airfare_index_records (calculation_date, frequency, advance_window);

