# MoSPI Real-time Airfare Price Index (APIx)
### SIH 2026 Problem Statement: SIH26056

Automated web scraping of airline and online travel aggregator portals for real-time augmentation of the **Consumer Price Index (CPI)** under the Ministry of Statistics and Programme Implementation (**MoSPI**).

---

## 🏛️ System Architecture: Step 1 Base Database & Route Basket

### 1. DGCA Route Basket & Statistical Weights
The system maintains a basket of top domestic city-pair flight corridors based on official **Directorate General of Civil Aviation (DGCA)** passenger traffic reports. Weights are normalized such that $\sum w_r = 1.000000$, fulfilling the requirements of the **Laspeyres Price Index** and **Geometric Young Index**:

| Route Code | Origin | Destination | Distance | Annual Passengers | Basket Weight ($w_r$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEL-BOM** | Delhi | Mumbai | 1,148 km | 7,420,000 | 0.2235 (22.35%) |
| **DEL-BLR** | Delhi | Bengaluru | 1,740 km | 4,950,000 | 0.1491 (14.91%) |
| **BOM-BLR** | Mumbai | Bengaluru | 842 km | 3,680,000 | 0.1108 (11.08%) |
| **DEL-CCU** | Delhi | Kolkata | 1,305 km | 3,150,000 | 0.0949 (9.49%) |
| **BLR-HYD** | Bengaluru | Hyderabad | 500 km | 2,820,000 | 0.0849 (8.49%) |
| **MAA-DEL** | Chennai | Delhi | 1,760 km | 2,640,000 | 0.0795 (7.95%) |
| **DEL-HYD** | Delhi | Hyderabad | 1,255 km | 2,510,000 | 0.0756 (7.56%) |
| **BOM-GOI** | Mumbai | Goa | 435 km | 2,200,000 | 0.0663 (6.63%) |
| **BOM-MAA** | Mumbai | Chennai | 1,030 km | 1,980,000 | 0.0596 (5.96%) |
| **CCU-BLR** | Kolkata | Bengaluru | 1,540 km | 1,850,000 | 0.0557 (5.57%) |
| **Total** | | | | **33,200,000** | **1.000000 (100%)** |

---

### 2. Monitored Airlines & Portals
- **Airlines**:
  - `6E` IndiGo (~60.5% market share)
  - `AI` Air India (~14.2% market share)
  - `IX` Air India Express (~6.8% market share)
  - `QP` Akasa Air (~4.8% market share)
  - `SG` SpiceJet (~4.0% market share)
- **Online Travel Aggregators (OTAs)**:
  - `MMT` MakeMyTrip
  - `EMT` EaseMyTrip

---

### 3. Advance Purchase Windows
MoSPI monitors 5 distinct purchasing horizons to capture advance purchase volatility:
- `T+1`: Last-minute corporate / distress travel
- `T+7`: Short-term travel
- `T+15`: Mid-term travel
- `T+30`: Standard advance leisure travel
- `T+45`: Long-term early booking

---

### 4. Database Schema Structure
- `routes`: Airport codes, city names, GPS coordinates, distance, active status.
- `dgca_route_weights`: Annual passenger volume, relative traffic share, normalized weight.
- `airlines`: Codes, names, airline vs OTA classification, base URLs, brand hex colors, market share.
- `price_quotes`: Timestamped price quotes, base fares, taxes & fees, total price, advance booking window, cabin class, outlier flags, proof-of-source snapshot hash (SHA-256).
- `scraper_audit_logs`: Crawler health, proxy IP, latency, anti-bot bypass rate.
- `airfare_index_records`: Calculated macro daily/weekly/monthly APIx inflation metrics.

---

### 5. Running the Step 1 Verification Test
To verify the database and inspect all metrics:
```bash
python backend/verify_step1.py
```
Outputs complete statistical summaries, weight sum verifications, and price distribution tables.

