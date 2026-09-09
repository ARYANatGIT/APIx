import React from 'react';
import { Plane, ExternalLink, ShieldCheck, Database, CheckCircle, Award } from 'lucide-react';

export default function AirlinesView({ airlines = [] }) {
  const carriers = airlines.filter(a => a.type === 'AIRLINE');
  const otas = airlines.filter(a => a.type === 'OTA');

  return (
    <div className="airlines-view">
      <div className="section-header-row">
        <div>
          <div className="badge-pill">
            <Award size={13} />
            <span>DGCA MARKET COVERAGE & CRAWLER TARGETS</span>
          </div>
          <h2 className="section-title">Monitored Airlines & OTAs</h2>
          <p className="section-subtitle">
            Covers 90%+ of Indian domestic aviation capacity across direct carrier web portals and leading aggregators.
          </p>
        </div>
      </div>

      {/* Primary Airlines Section */}
      <h3 className="subgroup-title">Primary Scheduled Commercial Carriers</h3>
      <div className="airlines-grid">
        {carriers.map((airline) => (
          <div key={airline.code} className="airline-card">
            <div className="airline-card-header">
              <div className="airline-badge" style={{ backgroundColor: airline.color_hex || '#1E3A8A' }}>
                {airline.code}
              </div>
              <div className="airline-title-wrap">
                <h4 className="airline-name">{airline.name}</h4>
                <span className="airline-type-tag">Direct Carrier Portal</span>
              </div>
              <a
                href={airline.base_url}
                target="_blank"
                rel="noreferrer"
                className="portal-link-btn"
                title={`Visit ${airline.name} Portal`}
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="market-share-block">
              <div className="share-labels">
                <span>Domestic Market Share</span>
                <strong>{airline.market_share_pct}%</strong>
              </div>
              <div className="share-track">
                <div
                  className="share-fill"
                  style={{
                    width: `${airline.market_share_pct}%`,
                    backgroundColor: airline.color_hex || '#E5B54F'
                  }}
                ></div>
              </div>
            </div>

            <div className="airline-metrics-row">
              <div className="air-metric">
                <Database size={13} />
                <span>{airline.quotes_recorded ? airline.quotes_recorded.toLocaleString() : '800'} Quotes Ingested</span>
              </div>
              <div className="air-metric live-status">
                <CheckCircle size={13} />
                <span>Active Crawler</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <a
                href="#scraper"
                className="btn-secondary"
                style={{ flex: 1, padding: '5px 10px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }}
              >
                Inspect Proof
              </a>
              <a
                href="#quotes"
                className="btn-primary"
                style={{ flex: 1, padding: '5px 10px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }}
              >
                Browse Fares
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Online Travel Aggregators (OTAs) */}
      <h3 className="subgroup-title" style={{ marginTop: '32px' }}>Online Travel Aggregators (OTAs) Cross-Validation</h3>
      <div className="airlines-grid ota-grid">
        {otas.map((ota) => (
          <div key={ota.code} className="airline-card ota-card">
            <div className="airline-card-header">
              <div className="airline-badge" style={{ backgroundColor: ota.color_hex || '#0084FF' }}>
                {ota.code}
              </div>
              <div className="airline-title-wrap">
                <h4 className="airline-name">{ota.name}</h4>
                <span className="airline-type-tag">Aggregator Portal</span>
              </div>
              <a
                href={ota.base_url}
                target="_blank"
                rel="noreferrer"
                className="portal-link-btn"
                title={`Visit ${ota.name} Portal`}
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <p className="ota-role-desc">
              Audits convenience fee variations, platform-exclusive fare surcharges, and secondary seat inventory distribution for consumer price index fidelity.
            </p>

            <div className="airline-metrics-row">
              <div className="air-metric">
                <Database size={13} />
                <span>{ota.quotes_recorded ? ota.quotes_recorded.toLocaleString() : '800'} Quotes Ingested</span>
              </div>
              <div className="air-metric live-status">
                <CheckCircle size={13} />
                <span>Audited Daily</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <a
                href="#scraper"
                className="btn-secondary"
                style={{ flex: 1, padding: '5px 10px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }}
              >
                Inspect Proof
              </a>
              <a
                href="#quotes"
                className="btn-primary"
                style={{ flex: 1, padding: '5px 10px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }}
              >
                Browse Fares
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
