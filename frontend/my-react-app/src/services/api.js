/**
 * MoSPI Real-time Airfare Price Index (APIx) - Frontend API Service
 * High-frequency dynamic communication with the FastAPI backend (/api/v1).
 * Zero hardcoded fallback arrays — 100% dynamic data from MongoDB Atlas.
 */

const BACKEND_PRIMARY = '/api/v1';
const BACKEND_CORS_1 = 'http://127.0.0.1:8000/api/v1';
const BACKEND_CORS_2 = 'http://localhost:8000/api/v1';

async function fetchFromBackend(endpoint, defaultVal = null) {
  // 1. Attempt relative path via Vite dev server / production proxy
  try {
    const res = await fetch(`${BACKEND_PRIMARY}${endpoint}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Continue to direct cross-origin endpoints
  }

  // 2. Attempt direct cross-origin connection via 127.0.0.1:8000
  try {
    const res = await fetch(`${BACKEND_CORS_1}${endpoint}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Continue to localhost:8000
  }

  // 3. Attempt direct cross-origin connection via localhost:8000
  try {
    const res = await fetch(`${BACKEND_CORS_2}${endpoint}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // All connection attempts failed
  }

  return defaultVal;
}

export const apiService = {
  // 1. Executive Macro Overview (latest APIx index, inflation rates, live stats)
  async getOverview() {
    return fetchFromBackend('/overview', null);
  },

  // 2. DGCA Routes Basket
  async getRoutes() {
    const data = await fetchFromBackend('/routes', []);
    return Array.isArray(data) ? data : [];
  },

  // 3. Monitored Airlines & OTAs
  async getAirlines(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/airlines${query ? `?${query}` : ''}`;
    const data = await fetchFromBackend(endpoint, []);
    return Array.isArray(data) ? data : [];
  },

  // 4. Advance Purchase Windows
  async getAdvanceWindows(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/advance-windows${query ? `?${query}` : ''}`;
    const data = await fetchFromBackend(endpoint, []);
    return Array.isArray(data) ? data : [];
  },

  // 5. Index Historical Series
  async getIndexSeries(frequency = "MONTHLY", limit = 33) {
    const data = await fetchFromBackend(`/index-records?frequency=${frequency}&limit=${limit}`, []);
    return Array.isArray(data) ? data : [];
  },

  // 6. Dynamic Real-time Calculated Index Trend & Corridor Decomposition
  async getIndexTrend(params = {}) {
    const query = new URLSearchParams({
      timeframe: params.timeframe || 'monthly',
      formula: params.formula || 'LASPEYRES',
      advance_window: params.advance_window || params.advanceWindow || 'ALL_WEIGHTED',
      route_code: params.route_code || params.routeCode || 'ALL'
    }).toString();
    return fetchFromBackend(`/index/trend?${query}`, null);
  },

  // 7. Flight Price Quotes Explorer
  async getQuotes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/quotes${query ? `?${query}` : ''}`;
    const data = await fetchFromBackend(endpoint, { total_count: 0, limit: params.limit || 50, offset: params.offset || 0, quotes: [] });
    return data || { total_count: 0, limit: 50, offset: 0, quotes: [] };
  },

  // 8. Proof of Source Audit
  async getProofOfSource(quoteId) {
    return fetchFromBackend(`/quotes/${quoteId}/proof`, null);
  },

  // 9. Crawler Resilience Logs
  async getScraperLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/scraper-logs${query ? `?${query}` : ''}`;
    const data = await fetchFromBackend(endpoint, []);
    return Array.isArray(data) ? data : [];
  },

  // 10. Master Consolidated Normalized Flights Dataset Summary
  async getMasterNormalizedData() {
    return fetchFromBackend('/scraper/master-dataset', null);
  },

  // 11. Scraper Artifacts List
  async getScraperArtifacts() {
    const data = await fetchFromBackend('/scraper/artifacts', []);
    return Array.isArray(data) ? data : [];
  },

  // 12. Carrier Screenshot Image URL Helper
  getCarrierScreenshotUrl(carrierCode) {
    return `${BACKEND_PRIMARY}/scraper/carrier-screenshot/${carrierCode}`;
  },

  // 13. Carrier Flights JSON Preview
  async getCarrierFlightsJson(carrierCode) {
    return fetchFromBackend(`/scraper/carriers/${carrierCode}/flights`, null);
  },

  async getCarrierFlights(carrierCode) {
    return this.getCarrierFlightsJson(carrierCode);
  },

  // 14. Full Pipeline Diagnostics
  async getPipelineStatus() {
    return fetchFromBackend('/pipeline/status', null);
  },

  // 15. Dynamic Flight Price Search
  async searchFlights(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await fetchFromBackend(`/search${query ? `?${query}` : ''}`, []);
    return Array.isArray(data) ? data : [];
  },

  // 16. MongoDB Status & Storage Telemetry
  async getMongoStatus() {
    return fetchFromBackend('/mongo/status', null);
  },

  // 17. Trigger MongoDB Database Sync
  async syncMongo(clearExisting = false) {
    try {
      const res = await fetch(`${BACKEND_CORS_1}/mongo/sync?clear_existing=${clearExisting}`, { method: 'POST' });
      return await res.json();
    } catch {
      try {
        const res2 = await fetch(`${BACKEND_PRIMARY}/mongo/sync?clear_existing=${clearExisting}`, { method: 'POST' });
        return await res2.json();
      } catch (e) {
        return { status: "error", message: e.message };
      }
    }
  },

  // 18. Automated Crawl Scheduler Status
  async getSchedulerStatus() {
    return fetchFromBackend('/scheduler/status', null);
  },

  // 19. Trigger Immediate Crawl in Background
  async triggerScrapeNow() {
    try {
      const res = await fetch(`${BACKEND_CORS_1}/scheduler/trigger`, { method: 'POST' });
      return await res.json();
    } catch {
      try {
        const res2 = await fetch(`${BACKEND_PRIMARY}/scheduler/trigger`, { method: 'POST' });
        return await res2.json();
      } catch (e) {
        return { status: "error", message: e.message };
      }
    }
  },

  // 20. Snapshot Content Retrieval
  async getSnapshotContent(filename) {
    return fetchFromBackend(`/snapshots/${filename}`, null);
  },

  // 21. Dynamic Heatmap Matrix & Calendar Quotes from MongoDB
  async getHeatmapData() {
    return fetchFromBackend('/heatmap', null);
  },

  // 22. Set Scheduler Crawl Interval
  async setSchedulerInterval(intervalMinutes) {
    try {
      const res = await fetch(`${BACKEND_CORS_1}/scheduler/interval?interval_minutes=${intervalMinutes}`, { method: 'POST' });
      return await res.json();
    } catch {
      try {
        const res2 = await fetch(`${BACKEND_PRIMARY}/scheduler/interval?interval_minutes=${intervalMinutes}`, { method: 'POST' });
        return await res2.json();
      } catch (e) {
        return { status: "error", message: e.message };
      }
    }
  }
};