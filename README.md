# AirSetu (एयरसेतु) • MoSPI Real-Time Airfare Price Index (APIx)
### Ministry of Statistics and Programme Implementation (MoSPI) • National Statistical Office (NSO)
**Smart India Hackathon 2026 — Problem Statement: SIH26056**

---

## 📌 Executive Summary

**AirSetu** is an enterprise, production-grade statistical intelligence platform developed for the **Ministry of Statistics and Programme Implementation (MoSPI)** and the **National Statistical Office (NSO)**, Government of India. 

AirSetu replaces obsolete manual airline ticket sampling by deploying automated, resilient web crawlers across direct scheduled carrier portals (**IndiGo, Air India, Akasa Air, SpiceJet**) and leading Online Travel Aggregators (**MakeMyTrip, EaseMyTrip**). It computes the high-frequency **Airfare Price Index (APIx)** using official **DGCA passenger traffic weights** and internationally standardized **Laspeyres / Geometric Young index formulas**, directly augmenting the transport group of India's monthly **Consumer Price Index (CPI)**.

---

## 🏛️ Statistical Methodology & Mathematical Foundations

### 1. Laspeyres Price Index Formula
The primary macro index computed by AirSetu follows the **Laspeyres Index**, holding quantities (annual passenger traffic weights) constant at the DGCA base period ($t=0$, Calendar Year 2024):

$$\text{APIx}_t = \sum_{r=1}^{R} w_r \left( \frac{P_{r,t}}{P_{r,0}} \right) \times 100$$

Where:
- $\text{APIx}_t$: Airfare Price Index for observation period $t$ (Base: $2024 = 100$)
- $R$: Total number of official monitored corridors ($R = 10$)
- $w_r$: DGCA passenger traffic basket weight of corridor $r$, strictly satisfying $\sum_{r=1}^{R} w_r = 1.000000$
- $P_{r,t}$: Current period aggregate price for corridor $r$
- $P_{r,0}$: DGCA benchmark base-period price for corridor $r$

### 2. Corridor Elementary Aggregate Price
For each corridor $r$, micro quotes are aggregated across $K = 6$ advance purchase booking horizons with behavioral weights $\alpha_k$:

$$P_{r,t} = \sum_{k=1}^{K} \alpha_k \cdot \bar{P}_{r,k,t}$$

Where $\bar{P}_{r,k,t}$ is the unweighted average ticket fare for advance horizon $k$:

$$\bar{P}_{r,k,t} = \frac{1}{N_{r,k}} \sum_{i=1}^{N_{r,k}} p_{r,k,i,t}$$

### 3. Advance Purchase Windows & Behavioral Weights ($\alpha_k$)
Consumer booking behaviors across India are stratified into 6 discrete time horizons:

| Horizon Code | Time Horizon | Consumer Segment | Behavioral Weight ($\alpha_k$) |
| :--- | :--- | :--- | :--- |
| **T+0** | Same-Day Booking | Emergency / Distress travel | 0.05 (5%) |
| **T+1** | 24–48h Departure | Urgent / Last-minute corporate | 0.15 (15%) |
| **T+7** | 7-Day Window | Flexible business travel | 0.25 (25%) |
| **T+15** | 15-Day Window | Planned domestic travel | 0.25 (25%) |
| **T+30** | 30-Day Window | Standard leisure vacation | 0.20 (20%) |
| **T+45** | 45-Day Window | Early baseline fare lock | 0.10 (10%) |
| **Total** | | | **1.000000 (100%)** |

### 4. Official DGCA Route Basket ($w_r$)
Corridor traffic weights are computed directly from the Directorate General of Civil Aviation (DGCA) annual domestic passenger traffic reports:

| Route Code | Origin Airport | Destination Airport | Distance | Annual Pax | Basket Weight ($w_r$) | Base Fare ($P_{r,0}$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEL-BOM** | Delhi (DEL) | Mumbai (BOM) | 1,148 km | 7,420,000 | 0.2235 (22.35%) | ₹6,400 |
| **DEL-BLR** | Delhi (DEL) | Bengaluru (BLR) | 1,740 km | 4,950,000 | 0.1491 (14.91%) | ₹7,600 |
| **BOM-BLR** | Mumbai (BOM) | Bengaluru (BLR) | 842 km | 3,680,000 | 0.1108 (11.08%) | ₹5,200 |
| **DEL-CCU** | Delhi (DEL) | Kolkata (CCU) | 1,305 km | 3,150,000 | 0.0949 (9.49%) | ₹6,800 |
| **BLR-HYD** | Bengaluru (BLR) | Hyderabad (HYD) | 500 km | 2,820,000 | 0.0849 (8.49%) | ₹4,200 |
| **MAA-DEL** | Chennai (MAA) | Delhi (DEL) | 1,760 km | 2,640,000 | 0.0795 (7.95%) | ₹7,500 |
| **DEL-HYD** | Delhi (DEL) | Hyderabad (HYD) | 1,255 km | 2,510,000 | 0.0756 (7.56%) | ₹5,900 |
| **BOM-GOI** | Mumbai (BOM) | Goa (GOI) | 435 km | 2,200,000 | 0.0663 (6.63%) | ₹4,500 |
| **BOM-MAA** | Mumbai (BOM) | Chennai (MAA) | 1,030 km | 1,980,000 | 0.0596 (5.96%) | ₹5,300 |
| **CCU-BLR** | Kolkata (CCU) | Bengaluru (BLR) | 1,540 km | 1,850,000 | 0.0557 (5.57%) | ₹7,100 |
| **Total Basket**| | | | **33,200,000** | **1.000000 (100%)** | **₹6,150 (Avg)** |

---

## 🗄️ Database Architecture (MongoDB Atlas)

The system is configured to connect to MongoDB Atlas (`apix_mospi`), ensuring 100% persistent, dynamic microdata without any reliance on local flat files or SQLite:

### Collection Schemas
1. `price_quotes`:
   - `route_code`: e.g., `"DEL-BOM"`
   - `origin_code` & `dest_code`: e.g., `"DEL"`, `"BOM"`
   - `airline_code` & `airline_name`: e.g., `"6E"`, `"IndiGo"`
   - `advance_window`: e.g., `"T+7"`
   - `base_fare`: Net carrier fare before taxes
   - `taxes_and_fees`: User development fee (UDF), GST, fuel surcharge
   - `total_fare`: Final consumer price ($P_{\text{base}} + P_{\text{taxes}}$)
   - `is_outlier`: Boolean flag computed via Tukey IQR
   - `snapshot_hash`: Cryptographic SHA-256 hash of raw HTML DOM proof
   - `scraped_at`: ISO timestamp of collection
2. `dgca_route_weights`: Corridors, annual passengers, distances, normalized weights.
3. `monitored_airlines`: Fleet profiles, DGCA market share percentages, active endpoints.
4. `scraper_audit_logs`: Session runtimes, HTTP statuses, latency, anti-bot bypass records.
5. `airfare_index_records`: Historical series records (Monthly, Weekly, Daily) with Laspeyres values.

---

## 🌐 FastAPI REST Backend Endpoints (`/api/v1`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/v1/overview` | `GET` | Executive macro summary, latest APIx value, top rising/falling corridors, 100% dynamic KPI cards |
| `/api/v1/heatmap` | `GET` | Authentic 10 corridors $\times$ 35 days matrix + 52-week contribution calendar generated from MongoDB |
| `/api/v1/routes` | `GET` | All 10 DGCA basket corridors with weights, passenger traffic, and live average fares |
| `/api/v1/airlines` | `GET` | 5 commercial carriers + 2 OTAs with market share, total quotes ingested, and average fares |
| `/api/v1/advance-windows`| `GET` | 6 advance purchase horizons with behavioral weights and price sensitivity curves |
| `/api/v1/index/trend` | `GET` | Dynamic APIx time-series with formula selection (`LASPEYRES`, `CARLI`, `DUTOT`, `JEVONS`) |
| `/api/v1/index-records` | `GET` | Historical monthly index series covering 33 continuous months |
| `/api/v1/quotes` | `GET` | Searchable quotes explorer with filtering by corridor, carrier, window, and outlier status |
| `/api/v1/quotes/{id}/proof` | `GET` | Proof-of-Source audit trail with cryptographic SHA-256 hash verification |
| `/api/v1/scraper-logs` | `GET` | Live telemetry of web scraper executions, latency, and status codes |
| `/api/v1/scraper/artifacts` | `GET` | List of carrier screenshots, logs, and normalized datasets |
| `/api/v1/mongo/status` | `GET` | MongoDB connection status, latency, and collection document counts |
| `/api/v1/scheduler/status`| `GET` | Background automated crawler schedule status |
| `/api/v1/scheduler/trigger`| `POST` | Immediately launch an asynchronous scrape across all portals |
| `/api/v1/scheduler/interval`| `POST` | Dynamically reconfigure scheduler frequency (in minutes) |

---

## 🚀 Quickstart & Execution Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- Active Internet connection for MongoDB Atlas cluster access

### 1. Environment Configuration
Ensure `.env` contains your database connection:
```ini
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=apix_mospi
CRAWLER_INTERVAL_MINUTES=30
PORT=8000
```

### 2. Install Dependencies
```bash
# Python backend requirements
pip install -r requirements.txt

# React frontend requirements
cd frontend/my-react-app
npm install
cd ../..
```

### 3. Launching AirSetu

#### Option A: One-Click Launchers (Windows)
- **Launch Both Backend & Frontend**: Double-click `run_all.bat`
- **Launch Backend Only**: Double-click `run_backend.bat`
- **Launch Frontend Only**: Double-click `run_frontend.bat`

#### Option B: Terminal Commands
```bash
# Terminal 1 - Backend FastAPI Server
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 - Frontend Vite React Server
cd frontend/my-react-app
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 💻 Frontend Views & Capabilities

1. **Editorial Home Poster**: Clean typographic cover featuring real-time statistics, dynamic national corpus counters, and dark/light theme switching.
2. **MoSPI Executive Macro Flight Deck (`#deck`)**:
   - Primary **APIx Headline Metric** with daily, weekly, and monthly rates of change.
   - **Top Rising Corridors & Top Falling Corridors** computed dynamically from real MongoDB price differences.
   - **India Airfare Heatmap**: 10 DGCA Corridors $\times$ 35 Days Matrix and GitHub-style 52-Week Contribution Grid.
3. **Route Basket Explorer (`#routes`)**: Interactive SVG route map connecting Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, and Goa.
4. **Index Trajectory & Inflation Chart (`#trajectory`)**: Interactive time series with SVG charting, formula switcher, corridor filter, and MoM/YoY inflation tooltips.
5. **Advance Curve View (`#windows`)**: Multi-horizon price curves illustrating how ticket prices escalate closer to departure.
6. **Airlines & OTAs Intelligence (`#airlines`)**: Live fleet breakdown, market dominance metric, and carrier portals.
7. **Live Price Quotes Explorer (`#quotes`)**: Instant sorting, filtering, 300-row pagination, SHA-256 proof modal, and CSV export.
8. **Crawler Health & Scraper Intelligence (`#scraper`)**: Anti-bot bypass success rate, scrape latency tracking, and instant crawl trigger.
9. **NSO Official Release & Data Export (`#export`)**: One-click download of NSO-standard CSV and JSON data releases.

---

## 📂 Project Organization

```
d:\SIH-26056\
├── backend\
│   ├── api.py                      # FastAPI REST server & API endpoints
│   ├── index_calculator.py         # Laspeyres formula, corridor breakdown & dynamic heatmap
│   ├── mongo.py                    # MongoDB Atlas connection manager & queries
│   ├── crawler_telemetry.py        # Ingestion pipeline & logger
│   ├── dgca_data.py                # Official DGCA route basket weights & coordinates
│   ├── scheduler.py                # Automated background crawl task runner
│   └── search_flight.py            # Microdata search service
├── scrapers\
│   ├── air_india\                  # Air India Playwright crawler
│   ├── indigo\                     # IndiGo Playwright crawler
│   ├── akasa_air\                  # Akasa Air Playwright crawler
│   ├── easemytrip\                 # EaseMyTrip scraper
│   ├── makemytrip\                 # MakeMyTrip scraper
│   └── run_all_scrapers.py         # Parallel scraper coordinator
├── frontend\my-react-app\
│   ├── src\
│   │   ├── components\             # UI Views: MoSPIMacroDashboard, Heatmap, Chart, etc.
│   │   ├── services\api.js         # Zero-fallback dynamic API client
│   │   ├── App.jsx                 # Master application controller & navigation
│   │   └── index.css / App.css     # Dark / Light mode styling tokens
│   └── package.json                # React dependencies
├── scripts\
│   ├── upload_to_cloudinary.py    # Cloudinary asset uploader
│   └── fix_git.bat                 # Git CRLF & remote repair utility
├── run_all.bat                     # Simultaneous backend + frontend launcher
├── run_backend.bat                 # Backend service runner
├── run_frontend.bat                # Frontend service runner
└── README.md                       # Official AirSetu documentation
```

---

## 👥 Contributors & Acknowledgements
- **Team AirSetu** — Smart India Hackathon 2026
- **Dataset Acknowledgement**: Directorate General of Civil Aviation (DGCA) & Ministry of Statistics and Programme Implementation (MoSPI), Government of India.


