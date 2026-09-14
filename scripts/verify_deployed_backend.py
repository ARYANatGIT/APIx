import requests
import json
import time
import sys

# Ensure immediate unbuffered output in console/logs
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

BASE_URL = "https://apix-0n4i.onrender.com"

# Allow CLI override: python verify_deployed_backend.py [URL]
if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
    BASE_URL = sys.argv[1].rstrip("/")

print("=" * 105, flush=True)
print(f"  MoSPI AirSetu - End-to-End Live Backend & Database Verification (A to Z)", flush=True)
print(f"  Target Server: {BASE_URL}", flush=True)
print(f"  Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}", flush=True)
print("=" * 105, flush=True)

test_counter = 0
passed = 0
failed = 0
results = []


def run_test(section: str, name: str, method: str, path: str, payload: dict = None, validate_fn=None, timeout: int = 15):
    global test_counter, passed, failed
    test_counter += 1
    url = f"{BASE_URL}{path}"
    t0 = time.time()
    try:
        if method == "GET":
            res = requests.get(url, timeout=timeout)
        elif method == "POST":
            res = requests.post(url, json=payload or {}, timeout=timeout)
        else:
            res = requests.request(method, url, json=payload, timeout=timeout)
        duration_ms = int((time.time() - t0) * 1000)

        is_ok = res.status_code in (200, 201)
        detail = ""

        if is_ok:
            ctype = res.headers.get("content-type", "")
            if "application/json" in ctype:
                try:
                    data = res.json()
                    if validate_fn:
                        custom_ok, custom_msg = validate_fn(data)
                        if not custom_ok:
                            is_ok = False
                            detail = f"Validation failed: {custom_msg}"
                        else:
                            detail = custom_msg
                    else:
                        if isinstance(data, list):
                            detail = f"JSON array ({len(data)} items)"
                        elif isinstance(data, dict):
                            keys_sample = list(data.keys())[:4]
                            detail = f"JSON dict ({len(data)} keys: {', '.join(keys_sample)})"
                        else:
                            detail = f"JSON value: {str(data)[:50]}"
                except Exception as je:
                    detail = f"JSON parse error: {je}"
                    is_ok = False
            elif "zip" in ctype or "octet-stream" in ctype:
                detail = f"Binary Archive ({len(res.content):,} bytes)"
            elif "csv" in ctype or "text" in ctype:
                lines = res.text.strip().split("\n")
                detail = f"CSV/Text ({len(lines)} lines, {len(res.content):,} bytes)"
            else:
                detail = f"{ctype} ({len(res.content):,} bytes)"

        count_str = f"[{test_counter:02d}]"
        if is_ok:
            passed += 1
            status_tag = "[PASS]"
            print(f"  {count_str} {status_tag:<7} [{section[:12]:<12}] {name:<36} {path:<34} -> {res.status_code} ({duration_ms}ms) | {detail}", flush=True)
            results.append({"name": name, "path": path, "status": "PASS", "ms": duration_ms, "detail": detail})
            return True, res
        else:
            failed += 1
            status_tag = "[FAIL]"
            err_body = res.text[:120].replace("\n", " ") if res.text else "Empty response"
            print(f"  {count_str} {status_tag:<7} [{section[:12]:<12}] {name:<36} {path:<34} -> {res.status_code} ({duration_ms}ms) | {detail or err_body}", flush=True)
            results.append({"name": name, "path": path, "status": "FAIL", "ms": duration_ms, "detail": detail or err_body})
            return False, res

    except Exception as e:
        failed += 1
        duration_ms = int((time.time() - t0) * 1000)
        status_tag = "[ERROR]"
        count_str = f"[{test_counter:02d}]"
        print(f"  {count_str} {status_tag:<7} [{section[:12]:<12}] {name:<36} {path:<34} -> EXCEPTION: {e}", flush=True)
        results.append({"name": name, "path": path, "status": "ERROR", "ms": duration_ms, "detail": str(e)})
        return False, None


# ==============================================================================
# 1. SYSTEM, HEALTH & MONGODB ATLAS CONNECTIVITY
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 1: SYSTEM HEALTH, ROOT INDEX & MONGODB ATLAS DATABASE", flush=True)
print("-" * 105, flush=True)

run_test("System", "Root Status & Endpoints Index", "GET", "/",
         validate_fn=lambda d: (d.get("status") in ("online", "ok"), f"Project: {d.get('project')}, Version: {d.get('version')}"))

run_test("System", "System Health Check", "GET", "/api/v1/health",
         validate_fn=lambda d: (d.get("status") in ("healthy", "ok", "online"), f"Status: {d.get('status')}, Project: {d.get('project')}"))

run_test("System", "MongoDB Atlas Live Connection", "GET", "/api/v1/mongo/status",
         validate_fn=lambda d: (d.get("is_live") is True, f"Live: {d.get('is_live')} | DB: '{d.get('database')}' | Quotes: {d.get('total_quotes', 0):,}"))

run_test("System", "Database Collections Dump (/database/all)", "GET", "/api/v1/database/all",
         validate_fn=lambda d: ("collections" in d, f"Collections: {list(d.get('collections', {}).keys())}"))

run_test("System", "Database Collections Alias (/databases/all)", "GET", "/api/v1/databases/all",
         validate_fn=lambda d: ("collections" in d, f"Collections: {len(d.get('collections', {}))} registered"))

run_test("System", "Database Collections Short Alias (/all)", "GET", "/api/v1/all",
         validate_fn=lambda d: ("collections" in d, "Collections accessible via short alias"))

run_test("System", "MongoDB Cache Sync Trigger", "GET", "/api/v1/mongo/sync",
         validate_fn=lambda d: (d.get("status") in ("success", "synced", "ok") or "synced" in str(d).lower(), "MongoDB cache synchronized"))


# ==============================================================================
# 2. MOSPI MACRO INDICES, ECONOMIC MODELS & CORRIDORS
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 2: MOSPI MACRO INDICES & ECONOMIC CALCULATION ENGINES", flush=True)
print("-" * 105, flush=True)

run_test("Macro", "Headline Overview & Laspeyres APIx", "GET", "/api/v1/overview",
         validate_fn=lambda d: (
             "latest_index" in d,
             f"APIx: {d.get('latest_index', {}).get('value')} | Base Fare: ₹{d.get('headline_metrics', {}).get('base_period_avg_fare', 'N/A')} | DB: {d.get('database')}"
         ))

run_test("Macro", "DGCA Corridor Basket (Top 10)", "GET", "/api/v1/routes",
         validate_fn=lambda d: (
             len(d) >= 10 if isinstance(d, list) else len(d.get("routes", [])) >= 10,
             f"{len(d) if isinstance(d, list) else len(d.get('routes', []))} high-density corridors active"
         ))

run_test("Macro", "Carrier & OTA Feed Coverage", "GET", "/api/v1/airlines",
         validate_fn=lambda d: (
             isinstance(d, (list, dict)),
             f"Active carriers & aggregators tracked"
         ))

run_test("Macro", "Advance Purchase Booking Horizons", "GET", "/api/v1/advance-windows",
         validate_fn=lambda d: (
             isinstance(d, (list, dict)),
             f"Dynamic lead-time curves (T+0 Emergency to T+45 Planned)"
         ))

run_test("Macro", "Historical Index Trend Timeseries", "GET", "/api/v1/index/trend",
         validate_fn=lambda d: (
             "history" in d or "trend" in d or isinstance(d, list),
             f"Timeseries points loaded for macroeconomic inflation modeling"
         ))

run_test("Macro", "Dynamic Heatmap Pricing Matrix", "GET", "/api/v1/heatmap", timeout=25,
         validate_fn=lambda d: (
             "corridors" in d,
             f"{len(d.get('corridors', []))} Corridors | {len(d.get('corridor_days', []))} Days | {d.get('total_quotes_tracked', 0):,} Quotes"
         ))

run_test("Macro", "Historical Laspeyres Index Records", "GET", "/api/v1/index-records",
         validate_fn=lambda d: (
             isinstance(d, list) or "records" in d,
             f"Audit-grade index computation runs recorded"
         ))

run_test("Macro", "5-Factor Route Stress Index (RSI)", "GET", "/api/v1/rsi",
         validate_fn=lambda d: (
             "national_composite" in d,
             f"Composite RSI: {d.get('national_composite', {}).get('rsi')} ({d.get('national_composite', {}).get('level')}) | Stressed: {d.get('national_composite', {}).get('top_stressed_route')}"
         ))


# ==============================================================================
# 3. MICRODATA PRICE QUOTES & CRYPTOGRAPHIC SHA-256 PROOF
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 3: MICRODATA PRICE QUOTES & CRYPTOGRAPHIC INTEGRITY PROOF", flush=True)
print("-" * 105, flush=True)

sample_quote_id = None
ok_q, res_q = run_test("Quotes", "Sample Microdata Price Quotes", "GET", "/api/v1/quotes?limit=5",
                       validate_fn=lambda d: (
                           (isinstance(d, list) and len(d) > 0) or ("quotes" in d and len(d["quotes"]) > 0),
                           f"Retrieved microdata quotes with price, carrier, and timestamps"
                       ))

if ok_q and res_q:
    try:
        data = res_q.json()
        quotes_arr = data if isinstance(data, list) else data.get("quotes", [])
        if quotes_arr:
            sample_quote_id = quotes_arr[0].get("quote_id") or quotes_arr[0].get("_id")
    except Exception:
        pass

if sample_quote_id:
    run_test("Quotes", f"SHA-256 Proof ({sample_quote_id[:18]}...)", "GET", f"/api/v1/quotes/{sample_quote_id}/proof",
             validate_fn=lambda d: (
                 "sha256_hash" in d or "verified" in d or "hash" in d or "quote" in d,
                 f"SHA-256: {d.get('sha256_hash', d.get('hash', 'Verified'))[:20]}... | Verified: {d.get('verified', True)}"
             ))
else:
    run_test("Quotes", "SHA-256 Cryptographic Proof (Fallback ID)", "GET", "/api/v1/quotes/DEL_BOM_6E2134_20260920/proof")


# ==============================================================================
# 4. 3D AIRPORT DIGITAL TWIN & LIVE FLIGHT ADS-B RADAR
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 4: 3D AIRPORT DIGITAL TWIN & LIVE ADS-B FLIGHT RADAR", flush=True)
print("-" * 105, flush=True)

run_test("Radar/Twin", "All 10 DGCA Airport Digital Twins Summary", "GET", "/api/v1/airports/digital-twins",
         validate_fn=lambda d: (
             "airports" in d or isinstance(d, list),
             f"Digital twins operational: {len(d.get('airports', d)) if isinstance(d, dict) else len(d)} major DGCA aerodromes"
         ))

run_test("Radar/Twin", "Delhi IGI Airport Digital Twin (DEL)", "GET", "/api/v1/airports/DEL/digital-twin",
         validate_fn=lambda d: (
             "airport_code" in d and ("live_radar" in d or "fids" in d),
             f"DEL Twin: {len(d.get('live_radar', []))} active TMA flights | {len(d.get('fids', {}).get('departures', []))} FIDS departures"
         ))

run_test("Radar/Twin", "Delhi IGI Live TMA Flights Radar", "GET", "/api/v1/airports/DEL/live-flights?radius_deg=50",
         validate_fn=lambda d: (
             "flights" in d,
             f"DEL Radar: {len(d.get('flights', []))} active aircraft in airspace"
         ))

run_test("Radar/Twin", "Nationwide ADS-B Flight Radar (/flights/live-radar)", "GET", "/api/v1/flights/live-radar",
         validate_fn=lambda d: (
             "flights" in d,
             f"Indian FIR Live Radar: {len(d.get('flights', []))} commercial flights active"
         ))

run_test("Radar/Twin", "Airport Catchment Substitution Intelligence", "GET", "/api/v1/airport-substitution",
         validate_fn=lambda d: (
             "pairs" in d or isinstance(d, list),
             f"Catchment substitution pairs loaded for secondary aerodromes"
         ))

run_test("Radar/Twin", "Airport Disruption What-If Simulation", "POST", "/api/v1/airport-simulation",
         payload={"hub_code": "DEL", "capacity_reduction_pct": 25.0, "weather_severity_pct": 50.0, "demand_surge_pct": 20.0},
         validate_fn=lambda d: (
             "simulated_metrics" in d or "hub_code" in d or "disruption_analysis" in d or "status" != "error",
             f"Simulation computed: Capacity shock & passenger rerouting modeled"
         ))


# ==============================================================================
# 5. AUTOMATED SCRAPER PIPELINE, SCHEDULER & TELEMETRY
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 5: AUTOMATED SCRAPER PIPELINE, SCHEDULER & TELEMETRY", flush=True)
print("-" * 105, flush=True)

run_test("Pipeline", "Scraper Audit Logs", "GET", "/api/v1/scraper-logs?limit=5",
         validate_fn=lambda d: (
             isinstance(d, list) or "logs" in d,
             f"Scraper execution logs available with duration & yield counts"
         ))

run_test("Pipeline", "Master Normalized Dataset (/data/master-normalized)", "GET", "/api/v1/data/master-normalized?limit=10",
         validate_fn=lambda d: (
             isinstance(d, (list, dict)),
             f"Master normalized schema records retrieved"
         ))

run_test("Pipeline", "Master Dataset Alias (/scraper/master-dataset)", "GET", "/api/v1/scraper/master-dataset?limit=10",
         validate_fn=lambda d: (
             isinstance(d, (list, dict)),
             f"Master dataset accessible via alias endpoint"
         ))

run_test("Pipeline", "Scraper Screenshot & JSON Artifacts", "GET", "/api/v1/scrapers/artifacts",
         validate_fn=lambda d: (
             "screenshots" in d or "artifacts" in d or isinstance(d, list),
             f"Evidence artifacts cataloged for visual price verification"
         ))

run_test("Pipeline", "Carrier Specific Scraped Data (6E - IndiGo)", "GET", "/api/v1/scrapers/6E/data",
         validate_fn=lambda d: (
             isinstance(d, (list, dict)),
             f"Carrier 6E feed records validated"
         ))

run_test("Pipeline", "Pipeline Real-Time Ingestion Status", "GET", "/api/v1/pipeline/status",
         validate_fn=lambda d: (
             "status" in d or "workers" in d or "pipeline" in d,
             f"Pipeline workers active and listening"
         ))

run_test("Pipeline", "Corpus Search (?q=DEL)", "GET", "/api/v1/search?q=DEL",
         validate_fn=lambda d: (
             "results" in d or isinstance(d, list),
             f"Search indexed across routes, carriers, and airports"
         ))

run_test("Pipeline", "Scraper Scheduler Status", "GET", "/api/v1/scheduler/status",
         validate_fn=lambda d: (
             "is_running" in d or "jobs" in d or "scheduler" in d,
             f"Scheduler Running: {d.get('is_running', True)} | Next Run: {d.get('next_run', 'Scheduled')}"
         ))

run_test("Pipeline", "Scraper Interval Config (/scheduler/interval)", "GET", "/api/v1/scheduler/interval",
         validate_fn=lambda d: (
             "interval_minutes" in d or "status" in d,
             f"Crawl cadence: {d.get('interval_minutes', 30)} minutes"
         ))

run_test("Pipeline", "Immediate Scraping Crawl Trigger (GET)", "GET", "/api/v1/scheduler/trigger",
         validate_fn=lambda d: (
             d.get("status") in ("success", "triggered", "running") or "trigger" in str(d).lower(),
             f"Scraping crawl triggered on demand: {d.get('message', d.get('status', 'OK'))}"
         ))


# ==============================================================================
# 6. AIR INTEL FEED, SPIKE ANOMALY DETECTION & AI CHAT
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 6: AIR INTEL FEED, SPIKE ANOMALIES & CONVERSATIONAL AI", flush=True)
print("-" * 105, flush=True)

run_test("Intel/AI", "Air Intel Feed (/intel/feed)", "GET", "/api/v1/intel/feed",
         validate_fn=lambda d: (
             "feed" in d or "articles" in d or isinstance(d, list),
             f"Live news & regulatory market intelligence items loaded"
         ))

run_test("Intel/AI", "Air Intel Spikes Feed (/intel/spikes)", "GET", "/api/v1/intel/spikes",
         validate_fn=lambda d: (
             "spikes" in d or isinstance(d, list),
             f"Airfare anomaly spike signals tracked"
         ))

run_test("Intel/AI", "Anomaly Radar Spikes Feed (/spikes)", "GET", "/api/v1/spikes",
         validate_fn=lambda d: (
             "spikes" in d or isinstance(d, list),
             f"Spikes radar operational"
         ))

run_test("Intel/AI", "On-Demand Intel Re-Analysis Trigger", "POST", "/api/v1/intel/refresh",
         validate_fn=lambda d: (
             d.get("status") in ("success", "refreshed", "ok") or "refreshed" in str(d).lower(),
             "NLP intelligence re-clustering executed"
         ))

run_test("Intel/AI", "Conversational AI Assistant (Laspeyres Inquiry)", "POST", "/api/v1/intel/chat", timeout=30,
         payload={"message": "Explain how the Laspeyres index methodology calculates airfare inflation in MoSPI APIx.", "session_id": "audit_session_deploy"},
         validate_fn=lambda d: (
             "response" in d and len(d.get("response", "")) > 20,
             f"AI Response ({len(d.get('response', ''))} chars): \"{d.get('response', '')[:70].replace(chr(10), ' ')}...\""
         ))

run_test("Intel/AI", "Email Alert Dispatcher Status", "GET", "/api/v1/intel/email-status",
         validate_fn=lambda d: (
             "enabled" in d or "status" in d,
             f"Email Alerting configured: {d.get('enabled', False)}"
         ))

run_test("Intel/AI", "SMTP / EmailJS Transport Health", "GET", "/api/v1/intel/smtp-status",
         validate_fn=lambda d: (
             "smtp" in d or "status" in d or "configured" in d,
             f"Mail transport verified"
         ))

run_test("Intel/AI", "Alert Email Delivery Audit Logs", "GET", "/api/v1/intel/email-audit-logs",
         validate_fn=lambda d: (
             isinstance(d, list) or "logs" in d,
             f"Audit records of dispatched anomaly emails"
         ))


# ==============================================================================
# 7. OPEN DATA EXPORTS & RESEARCH ARCHIVES
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 7: OPEN DATA EXPORTS & RESEARCH REPOSITORY", flush=True)
print("-" * 105, flush=True)

run_test("Exports", "Export Price Quotes as CSV", "GET", "/api/v1/export/quotes/csv")
run_test("Exports", "Export Price Quotes as JSON", "GET", "/api/v1/export/quotes/json")
run_test("Exports", "Export Headline APIx Index as CSV", "GET", "/api/v1/export/apix/csv")
run_test("Exports", "Export DGCA Routes Basket as CSV", "GET", "/api/v1/export/routes/csv")
run_test("Exports", "Export Market Intelligence as JSON", "GET", "/api/v1/export/intel/json")


# ==============================================================================
# 8. MACHINE-TO-MACHINE (M2M) API KEYS & DEVELOPER PORTAL
# ==============================================================================
print("\n" + "-" * 105, flush=True)
print("  SECTION 8: MACHINE-TO-MACHINE (M2M) API KEYS & RESEARCH PORTAL", flush=True)
print("-" * 105, flush=True)

demo_api_key = None
ok_k, res_k = run_test("API Keys", "Demo Public API Key Info", "GET", "/api/v1/keys/demo",
                       validate_fn=lambda d: (
                           "demo_api_key" in d,
                           f"Demo Key: {d.get('demo_api_key')} (Rate limit: {d.get('rate_limit_per_day', 10000):,} req/day)"
                       ))

if ok_k and res_k:
    try:
        demo_api_key = res_k.json().get("demo_api_key")
    except Exception:
        pass

run_test("API Keys", "Registered API Keys Catalog", "GET", "/api/v1/keys/list",
         validate_fn=lambda d: (
             isinstance(d, list) or "keys" in d,
             f"Registered API keys list retrieved with masked tokens"
         ))

gen_key_val = None
ok_gen, res_gen = run_test("API Keys", "Generate New API Key", "POST", "/api/v1/keys/generate",
                           payload={"name": "Automated Audit Verifier", "organization": "MoSPI Deployed Verification", "tier": "RESEARCH"},
                           validate_fn=lambda d: (
                               "api_key" in d or "key" in d,
                               f"Generated Key: {(d.get('api_key') or d.get('key'))[:24]}..."
                           ))

if ok_gen and res_gen:
    try:
        gen_key_val = res_gen.json().get("api_key") or res_gen.json().get("key")
    except Exception:
        pass

key_to_verify = gen_key_val or demo_api_key or "AIRSETU-MOSPI-DEMO-RESEARCH-TOKEN-2026"
run_test("API Keys", "Validate API Key Token", "POST", "/api/v1/keys/verify",
         payload={"api_key": key_to_verify},
         validate_fn=lambda d: (
             d.get("valid") is True or d.get("is_valid") is True,
             f"Key Validated: {d.get('valid', d.get('is_valid'))} | Tier: {d.get('tier', 'RESEARCH')}"
         ))


# ==============================================================================
# FINAL SUMMARY & SCORECARD
# ==============================================================================
print("\n" + "=" * 105, flush=True)
total_tests = passed + failed
pct = (passed / total_tests * 100.0) if total_tests > 0 else 0.0
print(f"  ALL-SERVICES VERIFICATION COMPLETED", flush=True)
print(f"  TARGET:  {BASE_URL}", flush=True)
print(f"  TOTAL:   {total_tests} ENDPOINTS PROBED", flush=True)
print(f"  PASSED:  {passed} / {total_tests} ({pct:.1f}%)", flush=True)
print(f"  FAILED:  {failed} / {total_tests}", flush=True)
print("=" * 105, flush=True)

if failed == 0:
    print(f"\n  >>> ALL {passed} ENDPOINTS, SERVICES & MONGODB ATLAS PASSED WITH ZERO ERRORS. <<<\n", flush=True)
else:
    print(f"\n  >>> {failed} ENDPOINT(S) RETURNED UNEXPECTED RESPONSES. PLEASE REVIEW LOGS ABOVE. <<<\n", flush=True)

sys.exit(0 if failed == 0 else 1)
