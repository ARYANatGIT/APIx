import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, TrendingUp, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function AdvanceWindowsView({ windowsData = [] }) {
  const [selectedWindow, setSelectedWindow] = useState('T+1');

  const currentWindow = windowsData.find(w => (w.window || w.advance_window) === selectedWindow) || windowsData[0];
  const t45Window = windowsData.find(w => (w.window || w.advance_window) === 'T+45' || (w.window || w.advance_window) === 'T+30') || windowsData[windowsData.length - 1];
  const baselineFare = t45Window ? Math.round(t45Window.average_fare) : 4814;
  const baselineLabel = t45Window ? (t45Window.window || t45Window.advance_window) : 'T+45';

  return (
    <div className="advance-windows-view">
      <div className="section-header-row">
        <div>
          <div className="badge-pill">
            <Clock size={13} />
            <span>ADVANCE PURCHASE VOLATILITY CURVE</span>
          </div>
          <h2 className="section-title">Advance Purchase Windows Analysis</h2>
          <p className="section-subtitle">
            MoSPI monitors 6 distinct purchasing horizons (T+0 to T+45) to dissect dynamic surge pricing from base transport inflation.
          </p>
        </div>
      </div>

      {/* Advance Window Cards */}
      <div className="windows-cards-grid">
        {windowsData.map((w) => {
          const winKey = w.window || w.advance_window;
          const isSelected = selectedWindow === winKey;
          const isT1 = winKey === 'T+1';
          const isT0 = winKey === 'T+0';
          const surgeVal = w.surge_ratio || w.surge_multiplier || 1.0;
          const quoteCnt = w.quotes_count !== undefined ? w.quotes_count : (w.quote_count || 0);

          return (
            <div
              key={winKey}
              className={`window-card ${isSelected ? 'active-card' : ''} ${isT1 || isT0 ? 't1-surge-card' : ''}`}
              onClick={() => setSelectedWindow(winKey)}
              role="button"
              tabIndex={0}
            >
              <div className="window-card-top">
                <span className="window-tag">{winKey}</span>
                {isT1 && (
                  <span className="outlier-alert-pill">
                    <AlertTriangle size={11} /> {w.outliers_detected || 0} Outliers
                  </span>
                )}
                {surgeVal > 1 && (
                  <span className="surge-tag">
                    {surgeVal}x Surge
                  </span>
                )}
              </div>

              <div className="window-fare-val">
                ₹{Math.round(w.average_fare || 0).toLocaleString()}
                <span className="fare-sub">avg fare</span>
              </div>

              <p className="window-desc">{w.description}</p>

              <div className="window-meta-stats">
                <div className="meta-stat">
                  <span>Min</span>
                  <strong>₹{Math.round(w.min_fare || 0).toLocaleString()}</strong>
                </div>
                <div className="meta-stat">
                  <span>Max</span>
                  <strong>₹{Math.round(w.max_fare || 0).toLocaleString()}</strong>
                </div>
                <div className="meta-stat">
                  <span>Quotes</span>
                  <strong>{quoteCnt.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-dive into Selected Horizon */}
      {currentWindow && (
        <div className="window-detail-card">
          <div className="detail-card-header">
            <div>
              <h3>Window Horizon: {currentWindow.window || currentWindow.advance_window} • Statistical Insights</h3>
              <p>{currentWindow.description}</p>
            </div>
            <div className="surge-multiplier-badge">
              <span>Dynamic Surge Ratio:</span>
              <strong>{currentWindow.surge_ratio || currentWindow.surge_multiplier}x Baseline ({baselineLabel})</strong>
            </div>
          </div>

          <div className="horizon-comparison-bar-wrap">
            <div className="horizon-bar-label">
              <span>Fare relative to {baselineLabel} leisure floor (₹{baselineFare.toLocaleString()})</span>
              <span><strong>₹{Math.round(currentWindow.average_fare || 0).toLocaleString()}</strong></span>
            </div>
            <div className="horizon-bar-track">
              <div
                className="horizon-bar-fill"
                style={{ width: `${Math.min(100, (currentWindow.average_fare / 11000) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="horizon-insights-grid">
            <div className="insight-card">
              <TrendingUp size={18} className="insight-icon icon-gold" />
              <div>
                <h4>Consumer Profile</h4>
                <p>
                  {currentWindow.window === 'T+1'
                    ? 'Corporate emergencies, last-minute business distress travellers with inelastic price sensitivity.'
                    : currentWindow.window === 'T+7'
                    ? 'Short-term personal travel and scheduled business meetings.'
                    : currentWindow.window === 'T+15'
                    ? 'Anchor planning horizon for domestic travel; balanced airline seat yield curves.'
                    : 'Leisure family holidays, planned festival bookings, holiday vacations.'}
                </p>
              </div>
            </div>

            <div className="insight-card">
              <ShieldAlert size={18} className="insight-icon icon-pink" />
              <div>
                <h4>MoSPI CPI Filtering</h4>
                <p>
                  {currentWindow.outliers_detected > 0
                    ? `IQR filter (1.5x) stripped ${currentWindow.outliers_detected} abnormal price spikes (e.g. ₹56,828) to prevent skewing headline retail inflation.`
                    : 'Clean price distribution within normal IQR bounds; full quote weight factored into Laspeyres formula.'}
                </p>
              </div>
            </div>

            <div className="insight-card">
              <CheckCircle2 size={18} className="insight-icon icon-green" />
              <div>
                <h4>Weight in Aggregate Index</h4>
                <p>
                  Integrated across all 10 DGCA corridors via weighted geometric average, ensuring headline APIx represents actual consumer expenditure proportions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
