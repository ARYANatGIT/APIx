import React, { useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function IndexTrendChart({ indexSeries = [], overviewData }) {
  const [timeframe, setTimeframe] = useState('30'); // '7' | '15' | '30'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!indexSeries || indexSeries.length === 0) {
    return null;
  }

  // Determine active slice based on timeframe
  const sliceCount = timeframe === '7' ? 7 : timeframe === '15' ? 15 : 30;
  const activeSeries = indexSeries.length > sliceCount 
    ? indexSeries.slice(-sliceCount) 
    : indexSeries;

  // Calculate SVG dimensions and scale
  const width = 900;
  const height = 330;
  const padding = { top: 40, right: 45, bottom: 65, left: 75 };

  const values = activeSeries.map(d => Number(d.index_value) || 100);
  const minDataVal = Math.min(...values, 99.0);
  const maxDataVal = Math.max(...values, 105.0);
  const rawMin = Math.floor(minDataVal - 0.8);
  const rawMax = Math.ceil(maxDataVal + 0.8);

  // Determine clean, human-readable step intervals for the Y-Axis
  const range = rawMax - rawMin;
  const rawStep = range / 5;
  let niceStep = 1;
  if (rawStep > 10) niceStep = 10;
  else if (rawStep > 5) niceStep = 5;
  else if (rawStep > 2) niceStep = 2.5;
  else if (rawStep > 1) niceStep = 2;
  else if (rawStep > 0.5) niceStep = 1;
  else niceStep = 0.5;

  const chartMin = Math.floor(rawMin / niceStep) * niceStep;
  const chartMax = Math.ceil(rawMax / niceStep) * niceStep;

  const gridLevels = [];
  for (let val = chartMin; val <= chartMax + 0.0001; val += niceStep) {
    gridLevels.push(Math.round(val * 10) / 10);
  }

  const xScale = (index) => padding.left + (index / (activeSeries.length - 1)) * (width - padding.left - padding.right);
  const yScale = (val) => (height - padding.bottom) - ((val - chartMin) / (chartMax - chartMin)) * (height - padding.top - padding.bottom);

  // Generate SVG path data
  const points = activeSeries.map((d, i) => ({
    x: xScale(i),
    y: yScale(Number(d.index_value) || 100),
    data: d
  }));

  const linePath = points.reduce((acc, p, i) => (
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  ), "");

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${height - padding.bottom}
    L ${points[0].x} ${height - padding.bottom}
    Z
  `;

  const base100Y = yScale(100.0);
  const latest = activeSeries[activeSeries.length - 1];
  const firstInView = activeSeries[0];

  const liveKpi = overviewData?.latest_index || latest || {};
  const currentVal = typeof latest?.index_value === 'number' ? latest.index_value : Number(latest?.index_value) || 105.12;
  const firstVal = Number(firstInView?.index_value) || 100.0;
  const periodNetPct = (((currentVal - firstVal) / firstVal) * 100).toFixed(2);
  const changeD1 = latest?.change_pct_d1 !== undefined ? latest.change_pct_d1 : (liveKpi.change_pct_d1 || 0.15);
  const changeM1 = latest?.change_pct_m1 !== undefined ? latest.change_pct_m1 : (liveKpi.change_pct_m1 || 5.12);

  const seriesHigh = Math.max(...values).toFixed(2);
  const seriesLow = Math.min(...values).toFixed(2);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        return `${day} ${months[mIdx] || parts[1]}`;
      }
    } catch (e) {
      // ignore
    }
    return dateStr.slice(5);
  };

  const shouldShowTick = (i, total) => {
    if (total <= 8) return true;
    const interval = total > 20 ? 4 : total > 12 ? 2 : 1;
    if (i === total - 1) return true;
    if (i % interval === 0) {
      return (total - 1 - i) >= Math.ceil(interval / 1.5);
    }
    return false;
  };

  return (
    <div className="index-trend-card bold-editorial-card">
      <div className="trend-card-header">
        <div>
          <div className="trend-pill bold-mono-pill">
            <span className="accent-square">■</span>
            <span>MACRO CPI AUGMENTATION // HIGH-FREQUENCY INFLATION</span>
          </div>
          <h3 className="trend-title bold-display-title">MoSPI Airfare Price Index (APIx) Time-Series</h3>
          <p className="trend-subtitle bold-editorial-subtitle">
            {timeframe === '30' ? '30-DAY' : timeframe === '15' ? '15-DAY' : '7-DAY'} REAL-TIME TRAJECTORY • BASE PERIOD: 2024-Q1 = 100.00 • LASPEYRES ENGINE
          </p>
        </div>

        <div className="trend-header-right">
          {/* Timeframe Range Selector - Sharp Rectangles */}
          <div className="trend-range-selector bold-range-selector">
            <button
              type="button"
              className={`trend-range-btn ${timeframe === '7' ? 'active' : ''}`}
              onClick={() => { setTimeframe('7'); setHoveredPoint(null); }}
            >
              7D
            </button>
            <button
              type="button"
              className={`trend-range-btn ${timeframe === '15' ? 'active' : ''}`}
              onClick={() => { setTimeframe('15'); setHoveredPoint(null); }}
            >
              15D
            </button>
            <button
              type="button"
              className={`trend-range-btn ${timeframe === '30' ? 'active' : ''}`}
              onClick={() => { setTimeframe('30'); setHoveredPoint(null); }}
            >
              30D (FULL)
            </button>
          </div>

          {/* Quick Metric Boxes in Dark Sharp Boxes */}
          <div className="trend-quick-kpis">
            <div className="kpi-mini-box bold-kpi-box">
              <span className="kpi-mini-label">CURRENT APIx</span>
              <span className="kpi-mini-val val-accent">{typeof currentVal === 'number' ? currentVal.toFixed(2) : currentVal}</span>
            </div>
            <div className="kpi-mini-box bold-kpi-box">
              <span className="kpi-mini-label">{timeframe}D NET DRIFT</span>
              <span className={`kpi-mini-val ${Number(periodNetPct) >= 0 ? 'val-accent' : 'val-muted'}`}>
                {Number(periodNetPct) >= 0 ? <ArrowUpRight size={13} strokeWidth={2} /> : <ArrowDownRight size={13} strokeWidth={2} />}
                {Number(periodNetPct) >= 0 ? `+${periodNetPct}` : periodNetPct}%
              </span>
            </div>
            <div className="kpi-mini-box bold-kpi-box">
              <span className="kpi-mini-label">DAY-OVER-DAY</span>
              <span className="kpi-mini-val val-white">
                {Number(changeD1) >= 0 ? `+${changeD1}` : changeD1}%
              </span>
            </div>
            <div className="kpi-mini-box bold-kpi-box">
              <span className="kpi-mini-label">MONTH-OVER-MONTH</span>
              <span className="kpi-mini-val val-accent">
                {Number(changeM1) >= 0 ? `+${changeM1}` : changeM1}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg bold-trend-svg" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="trendGradientBold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3D00" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FF3D00" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="strokeGradientBold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FAFAFA" />
              <stop offset="35%" stopColor="#FAFAFA" />
              <stop offset="100%" stopColor="#FF3D00" />
            </linearGradient>
          </defs>

          {/* Dynamic Horizontal Grid Lines */}
          {gridLevels.map((level) => {
            const y = yScale(level);
            const isBase = Math.abs(level - 100.0) < 0.2;
            return (
              <g key={level} className="grid-group">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isBase ? "#FF3D00" : "#1F2420"}
                  strokeDasharray={isBase ? "4 3" : "2 3"}
                  strokeWidth={isBase ? "1.5" : "1"}
                  strokeOpacity={isBase ? 0.75 : 0.6}
                />

                <line
                  x1={padding.left - 6}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke="#404040"
                  strokeWidth="1"
                />

                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={isBase ? "#FF3D00" : "#737373"}
                  fontSize="11"
                  fontWeight={isBase ? "700" : "500"}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {level.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Y-Axis Baseline Line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#262626"
            strokeWidth="1.5"
          />

          {/* Y-Axis Title */}
          <text
            transform="rotate(-90)"
            x={-(padding.top + (height - padding.bottom - padding.top) / 2)}
            y={22}
            textAnchor="middle"
            fill="#737373"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.1em"
            fontFamily="JetBrains Mono, monospace"
          >
            INDEX VALUE (BASE 100.0)
          </text>

          {/* X-Axis Baseline Line */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#262626"
            strokeWidth="1.5"
          />

          {/* X-Axis Title */}
          <text
            x={padding.left + (width - padding.left - padding.right) / 2}
            y={height - 10}
            textAnchor="middle"
            fill="#737373"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.1em"
            fontFamily="JetBrains Mono, monospace"
          >
            CALCULATION TIMELINE // {activeSeries.length} ACTIVE SAMPLES
          </text>

          {/* Base 100.0 Reference Badge */}
          {base100Y >= padding.top && base100Y <= height - padding.bottom && (
            <g className="base-100-badge">
              <rect
                x={width - padding.right - 190}
                y={base100Y - 18}
                width="190"
                height="17"
                fill="#1A1A1A"
                stroke="#FF3D00"
                strokeWidth="1"
              />
              <text
                x={width - padding.right - 8}
                y={base100Y - 6}
                textAnchor="end"
                fill="#FF3D00"
                fontSize="9.5"
                fontWeight="700"
                letterSpacing="0.08em"
                fontFamily="JetBrains Mono, monospace"
              >
                BASE ANCHOR (2024-Q1 = 100.0)
              </text>
            </g>
          )}

          {/* Gradient Fill Under Curve */}
          <path d={areaPath} fill="url(#trendGradientBold)" />

          {/* High-Contrast Bold Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#strokeGradientBold)"
            strokeWidth="3.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Interactive Data Points and X-Axis Ticks */}
          {points.map((p, i) => {
            const isHovered = hoveredPoint === i;
            const showTick = shouldShowTick(i, points.length);

            return (
              <g
                key={i}
                className="chart-point-group"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* X-Axis Tick Mark */}
                {showTick && (
                  <line
                    x1={p.x}
                    y1={height - padding.bottom}
                    x2={p.x}
                    y2={height - padding.bottom + 6}
                    stroke="#404040"
                    strokeWidth="1"
                  />
                )}

                {/* X-Axis Date Label */}
                {showTick && (
                  <text
                    x={p.x}
                    y={height - padding.bottom + 22}
                    textAnchor="middle"
                    fill="#737373"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.05em"
                  >
                    {formatDateLabel(p.data.calculation_date)}
                  </text>
                )}

                {/* Invisible hover radius */}
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                {/* Sharp Square Data Mark */}
                <rect
                  x={p.x - (isHovered ? 4.5 : (activeSeries.length > 20 ? 2.5 : 3.5))}
                  y={p.y - (isHovered ? 4.5 : (activeSeries.length > 20 ? 2.5 : 3.5))}
                  width={isHovered ? 9 : (activeSeries.length > 20 ? 5 : 7)}
                  height={isHovered ? 9 : (activeSeries.length > 20 ? 5 : 7)}
                  fill={isHovered ? "#FF3D00" : "#0A0A0A"}
                  stroke={isHovered ? "#FAFAFA" : "#FF3D00"}
                  strokeWidth={isHovered ? 2 : 1.5}
                />
              </g>
            );
          })}

          {/* Hover Tooltip Card - Sharp Dark Box */}
          {hoveredPoint !== null && (() => {
            const pt = points[hoveredPoint];
            const tooltipWidth = 180;
            const boundedX = Math.min(
              Math.max(padding.left + tooltipWidth / 2, pt.x),
              width - padding.right - tooltipWidth / 2
            );
            const boundedY = Math.max(padding.top + 15, pt.y - 54);
            const pData = pt.data;
            const fareStr = pData.average_fare ? `₹${Math.round(pData.average_fare).toLocaleString()}` : '';

            return (
              <g transform={`translate(${boundedX}, ${boundedY})`}>
                <rect
                  x={-tooltipWidth / 2}
                  y="-34"
                  width={tooltipWidth}
                  height="48"
                  fill="#0A0A0A"
                  stroke="#FF3D00"
                  strokeWidth="1.5"
                />
                <text x="0" y="-15" textAnchor="middle" fill="#737373" fontSize="10" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                  {pData.calculation_date} • {fareStr}
                </text>
                <text x="0" y="5" textAnchor="middle" fill="#FAFAFA" fontSize="11.5" fontWeight="700" fontFamily="Inter Tight, sans-serif">
                  APIx: <tspan fill="#FF3D00">{Number(pData.index_value).toFixed(2)}</tspan> (DoD: <tspan fill={Number(pData.change_pct_d1) >= 0 ? '#FF3D00' : '#737373'}>{Number(pData.change_pct_d1) >= 0 ? `+${pData.change_pct_d1}` : pData.change_pct_d1}%</tspan>)
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="chart-footer-note bold-footer-note">
        <div className="footer-metric">
          <span>{timeframe}D RANGE:</span>
          <strong>HIGH {seriesHigh} // LOW {seriesLow}</strong>
        </div>
        <div className="footer-metric">
          <span>WEIGHTED BASKET FARE:</span>
          <strong>₹{overviewData?.latest_index?.average_fare ? Math.round(overviewData.latest_index.average_fare).toLocaleString() : (latest ? Math.round(latest.average_fare).toLocaleString() : "6,885")}</strong>
        </div>
        <div className="footer-metric">
          <span>STATISTICAL ENGINE:</span>
          <strong>LASPEYRES FIXED-BASE FORMULATION</strong>
        </div>
        <div className="footer-metric">
          <span>ACTIVE SAMPLES:</span>
          <strong>{activeSeries.length} CONSECUTIVE CALENDAR SAMPLES</strong>
        </div>
      </div>
    </div>
  );
}
