import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, AlertCircle, Plane, Clock, Eye, Download, ChevronRight } from 'lucide-react';
import { apiService } from '../services/api';
import ProofOfSourceModal from './ProofOfSourceModal';

export default function QuotesExplorer({ initialQuotes = [], refreshTrigger }) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [totalCount, setTotalCount] = useState(initialQuotes.length || 4291);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedAirline, setSelectedAirline] = useState('');
  const [selectedWindow, setSelectedWindow] = useState('');
  const [outlierOnly, setOutlierOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Proof Modal state
  const [auditQuote, setAuditQuote] = useState(null);

  useEffect(() => {
    fetchFilteredQuotes();
  }, [selectedRoute, selectedAirline, selectedWindow, outlierOnly, refreshTrigger]);

  const fetchFilteredQuotes = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (selectedRoute) params.route_code = selectedRoute;
      if (selectedAirline) params.airline_code = selectedAirline;
      if (selectedWindow) params.advance_window = selectedWindow;
      if (outlierOnly) params.is_outlier = true;

      const res = await apiService.getQuotes(params);
      if (res && res.quotes) {
        setQuotes(res.quotes);
        if (res.total_count) setTotalCount(res.total_count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const flightNum = (q.flight_number || '').toLowerCase();
    const rCode = (q.route_code || q.route || '').toLowerCase();
    const aName = (q.airline_name || q.airline || '').toLowerCase();
    return flightNum.includes(term) || rCode.includes(term) || aName.includes(term);
  });

  return (
    <div className="quotes-explorer-view">
      <div className="section-header-row">
        <div>
          <div className="badge-pill">
            <ShieldCheck size={13} />
            <span>REAL-TIME SCRAPED FARES & AUDIT TRAIL</span>
          </div>
          <h2 className="section-title">Live Price Quotes Explorer</h2>
          <p className="section-subtitle">
            Searchable repository of {totalCount.toLocaleString()} individual flight ticket price quotes collected across 10 DGCA corridors and 6 booking horizons (T+0 to T+45).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="explorer-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search flight number, route or carrier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Route Corridor Select */}
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="filter-select"
        >
          <option value="">All 10 DGCA Corridors</option>
          <option value="DEL-BOM">DEL-BOM (22.35%)</option>
          <option value="DEL-BLR">DEL-BLR (14.91%)</option>
          <option value="BOM-BLR">BOM-BLR (11.08%)</option>
          <option value="DEL-CCU">DEL-CCU (9.49%)</option>
          <option value="BLR-HYD">BLR-HYD (8.49%)</option>
          <option value="MAA-DEL">MAA-DEL (7.95%)</option>
          <option value="DEL-HYD">DEL-HYD (7.56%)</option>
          <option value="BOM-GOI">BOM-GOI (6.63%)</option>
          <option value="BOM-MAA">BOM-MAA (5.96%)</option>
          <option value="CCU-BLR">CCU-BLR (5.57%)</option>
        </select>

        {/* Airline Select */}
        <select
          value={selectedAirline}
          onChange={(e) => setSelectedAirline(e.target.value)}
          className="filter-select"
        >
          <option value="">All Airlines & OTAs</option>
          <option value="6E">IndiGo (6E)</option>
          <option value="AI">Air India (AI)</option>
          <option value="IX">Air India Express (IX)</option>
          <option value="QP">Akasa Air (QP)</option>
          <option value="SG">SpiceJet (SG)</option>
          <option value="MMT">MakeMyTrip (MMT)</option>
          <option value="EMT">EaseMyTrip (EMT)</option>
        </select>

        {/* Advance Window Select */}
        <select
          value={selectedWindow}
          onChange={(e) => setSelectedWindow(e.target.value)}
          className="filter-select"
        >
          <option value="">All Windows (T+0 .. T+45)</option>
          <option value="T+0">T+0 Day (Same-Day / Distress)</option>
          <option value="T+1">T+1 Day (Spot / Corporate)</option>
          <option value="T+7">T+7 Days (Weekly Anchor)</option>
          <option value="T+15">T+15 Days (Mid-term)</option>
          <option value="T+30">T+30 Days (Monthly Leisure)</option>
          <option value="T+45">T+45 Days (Early Floor)</option>
        </select>

        {/* Outlier Filter Button */}
        <button
          className={`filter-btn-toggle ${outlierOnly ? 'active-toggle' : ''}`}
          onClick={() => setOutlierOnly(!outlierOnly)}
        >
          <AlertCircle size={14} />
          <span>{outlierOnly ? 'Showing Outliers' : 'Filter Outliers'}</span>
        </button>
      </div>

      {/* Quotes Table */}
      <div className="table-responsive-wrapper">
        <table className="quotes-table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>Sector</th>
              <th>Carrier</th>
              <th>Window</th>
              <th>Departure / Arrival</th>
              <th>Duration</th>
              <th>Base Fare</th>
              <th>Taxes & Fees</th>
              <th>Total Normalised</th>
              <th>Status</th>
              <th>Proof of Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map((q, idx) => (
              <tr key={q.id || idx} className={q.is_outlier ? 'outlier-row' : ''}>
                <td className="font-mono font-bold">{q.flight_number}</td>
                <td>
                  <span className="route-badge-sm">{q.route_code || q.route}</span>
                </td>
                <td>
                  <span
                    className="carrier-tag-pill"
                    style={{ borderColor: q.airline_color || '#E5B54F' }}
                  >
                    {q.airline_name || q.airline}
                  </span>
                </td>
                <td>
                  <span className={`window-badge-sm ${q.advance_window === 'T+1' ? 't1-badge' : ''}`}>
                    {q.advance_window}
                  </span>
                </td>
                <td className="font-mono">
                  {q.departure_time} ➔ {q.arrival_time}
                </td>
                <td>{q.stops_text || (q.duration_mins ? `${q.duration_mins}m` : (q.stops === 0 ? 'Non-stop' : `${q.stops} stops`))}</td>
                <td>₹{Math.round(q.base_fare || 0).toLocaleString()}</td>
                <td>₹{Math.round(q.taxes_and_fees || 0).toLocaleString()}</td>
                <td className="font-bold val-gold">₹{Math.round(q.total_fare || 0).toLocaleString()}</td>
                <td>
                  {q.is_outlier ? (
                    <span className="tag-outlier">IQR Spiked</span>
                  ) : (
                    <span className="tag-clean">Cleaned</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn-proof-inspect"
                    onClick={() => setAuditQuote(q)}
                    title="Inspect SHA-256 Government Proof of Source"
                  >
                    <ShieldCheck size={14} />
                    <span>SHA-256</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Proof of Source Inspection Modal */}
      <ProofOfSourceModal
        isOpen={!!auditQuote}
        onClose={() => setAuditQuote(null)}
        quote={auditQuote}
      />
    </div>
  );
}
