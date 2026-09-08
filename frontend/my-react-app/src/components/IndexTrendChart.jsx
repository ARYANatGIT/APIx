import React, { useState } from 'react';
import { TrendingUp, Activity, BarChart2, Calendar, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function IndexTrendChart({ indexSeries = [], overviewData }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!indexSeries || indexSeries.length === 0) {
    return null;
  }

  // Calculate SVG dimensions and scale
  const width = 840;
  const height = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const values = indexSeries.map(d => d.index_value);
  const minVal = Math.min(99.0, ...values);
  const maxVal = Math.max(106.0, ...values);

  const xScale = (index) => padding.left + (index / (indexSeries.length - 1)) * (width - padding.left - padding.right);
  const yScale = (val) => height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

  // Generate SVG path data
  const points = indexSeries.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.index_value),
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
  const latest = indexSeries[indexSeries.length - 1];

  return (
    <div className="index-trend-card">
      <div className="trend-card-header">
        <div>
          <div className="trend-pill">
            <Activity size={13} className="spin-pulse" />
            <span>CPI TRANSPORT AUGMENTATION • HIGH-FREQUENCY INFLATION</span>
          </div>
          <h3 className="trend-title">MoSPI Airfare Price Index (APIx) Time-Series</h3>
          <p className="trend-subtitle">15-Day Real-Time Trajectory • Base Period: 2024-Q1 = 100.00 • Laspeyres Formula</p>
        </div>

        <div className="trend-quick-kpis">
          <div className="kpi-mini-box">
            <span className="kpi-mini-label">Current APIx</span>
            <span className="kpi-mini-val val-gold">{latest ? latest.index_value.toFixed(2) : "104.77"}</span>
          </div>
          <div className="kpi-mini-box">
            <span className="kpi-mini-label">Day-over-Day</span>
            <span className="kpi-mini-val val-green">
              <ArrowUpRight size={14} />
              +{latest ? latest.change_pct_d1 : "0.15"}%
            </span>
          </div>
          <div className="kpi-mini-box">
            <span className="kpi-mini-label">Month-over-Month</span>
            <span className="kpi-mini-val val-green">
              +{latest ? latest.change_pct_m1 : "4.77"}%
            </span>
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5B54F" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E5B54F" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E8CF7A" />
              <stop offset="50%" stopColor="#FBE697" />
              <stop offset="100%" stopColor="#E6347A" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[100.0, 102.0, 104.0, 106.0].map((level) => {
            const y = yScale(level);
            return (
              <g key={level} className="grid-group">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray={level === 100.0 ? "none" : "3 3"}
                  strokeWidth={level === 100.0 ? "1.5" : "1"}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={level === 100.0 ? "#FBE697" : "rgba(255, 255, 255, 0.4)"}
                  fontSize="11"
                  fontWeight={level === 100.0 ? "700" : "500"}
                >
                  {level.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Base 100.0 Marker label */}
          <text
            x={width - padding.right}
            y={base100Y - 6}
            textAnchor="end"
            fill="#FBE697"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.5"
          >
            BASE PERIOD (2024-Q1 = 100.0)
          </text>

          {/* Gradient Area */}
          <path d={areaPath} fill="url(#trendGradient)" />

          {/* Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredPoint === i;
            return (
              <g
                key={i}
                className="chart-point-group"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible hover radius */}
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "6" : "3.5"}
                  fill={isHovered ? "#ffffff" : "#E5B54F"}
                  stroke="#161A17"
                  strokeWidth="2"
                  filter={isHovered ? "drop-shadow(0 0 8px #FBE697)" : "none"}
                />

                {/* X Axis Date Labels (every 2nd item) */}
                {i % 2 === 0 && (
                  <text
                    x={p.x}
                    y={height - 12}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.45)"
                    fontSize="10"
                  >
                    {p.data.calculation_date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Tooltip Card inside SVG */}
          {hoveredPoint !== null && (
            <g transform={`translate(${points[hoveredPoint].x}, ${points[hoveredPoint].y - 45})`}>
              <rect
                x="-65"
                y="-25"
                width="130"
                height="32"
                rx="6"
                fill="rgba(22, 26, 23, 0.95)"
                stroke="#E5B54F"
                strokeWidth="1"
              />
              <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                {points[hoveredPoint].data.calculation_date}
              </text>
              <text x="0" y="2" textAnchor="middle" fill="#FBE697" fontSize="11" fontWeight="700">
                APIx: {points[hoveredPoint].data.index_value.toFixed(2)} (DoD: +{points[hoveredPoint].data.change_pct_d1}%)
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="chart-footer-note">
        <div className="footer-metric">
          <span>Weighted Basket Average Fare:</span>
          <strong>₹{latest ? Math.round(latest.average_fare).toLocaleString() : "6,835"}</strong>
        </div>
        <div className="footer-metric">
          <span>Statistical Engine:</span>
          <strong>Laspeyres Fixed Base Basket Formulation</strong>
        </div>
        <div className="footer-metric">
          <span>Daily Sample Size:</span>
          <strong>~520 Validated Quotes (Outliers Excluded via IQR 1.5x)</strong>
        </div>
      </div>
    </div>
  );
}
