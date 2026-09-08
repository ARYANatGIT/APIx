import React from 'react';
import { ShieldCheck, Activity, Cpu, Server, CheckCircle2, AlertTriangle, Clock, Globe } from 'lucide-react';

export default function ScraperHealthView({ logs = [], scraperStats = {} }) {
  return (
    <div className="scraper-health-view">
      <div className="section-header-row">
        <div>
          <div className="badge-pill">
            <Cpu size={13} />
            <span>ANTI-BOT BYPASS & CRAWLER RESILIENCE</span>
          </div>
          <h2 className="section-title">Crawler Health & Scraper Audit Logs</h2>
          <p className="section-subtitle">
            Monitors high-frequency web crawler latency, rotating proxy IP performance, and anti-bot bypass resilience.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Crawler Resilience Rate</span>
            <span className="kpi-value val-green">{scraperStats.resilience_rate_pct || 100.0}%</span>
            <span className="kpi-sub">Anti-bot bypass success</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-gold">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Average Scrape Latency</span>
            <span className="kpi-value val-gold">{scraperStats.average_latency_ms || 2989} ms</span>
            <span className="kpi-sub">Round-trip extraction time</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <Server size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Audit Logs Recorded</span>
            <span className="kpi-value">{scraperStats.audit_logs_count || logs.length || 28} events</span>
            <span className="kpi-sub">SHA-256 verifiable logs</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-pink">
            <Globe size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Proxy IP Pool</span>
            <span className="kpi-value">Rotating IPv4</span>
            <span className="kpi-sub">Indian residential subnets</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <h3 className="subgroup-title" style={{ marginTop: '28px' }}>Recent Crawler Execution Events</h3>
      <div className="table-responsive-wrapper">
        <table className="quotes-table scraper-table">
          <thead>
            <tr>
              <th>Target Entity</th>
              <th>Sector Scraped</th>
              <th>Status</th>
              <th>HTTP Code</th>
              <th>Latency</th>
              <th>Quotes Parsed</th>
              <th>Proxy IP</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              const isBypassed = log.status === 'CAPTCHA_BYPASSED' || log.status === 'BLOCKED_CLOUDFLARE_RECOVERED';

              return (
                <tr key={log.id}>
                  <td className="font-bold">{log.airline_name} ({log.airline_code})</td>
                  <td><span className="route-badge-sm">{log.route_code}</span></td>
                  <td>
                    {isSuccess ? (
                      <span className="tag-clean">
                        <CheckCircle2 size={12} /> SUCCESS
                      </span>
                    ) : (
                      <span className="tag-bypass">
                        <ShieldCheck size={12} /> {log.status}
                      </span>
                    )}
                  </td>
                  <td className="font-mono">{log.http_status || 200}</td>
                  <td className="font-mono">{log.latency_ms} ms</td>
                  <td className="font-mono">{log.quotes_extracted} quotes</td>
                  <td className="font-mono font-xs">{log.proxy_ip}</td>
                  <td className="font-mono font-xs">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
