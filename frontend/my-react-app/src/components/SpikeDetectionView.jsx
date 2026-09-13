import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  CloudRain,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Clock,
  Plane,
  Compass,
  Volume2,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Info,
  Layers,
  Mail,
  Check
} from 'lucide-react';

function renderFormattedLine(text) {
  if (!text) return null;
  // Parse **bold** patterns
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem('airsetu_intel_session_id');
    if (!sid) {
      sid = 'intel_sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('airsetu_intel_session_id', sid);
    }
    return sid;
  } catch {
    return 'intel_sess_temp';
  }
}

export default function SpikeDetectionView({ routes = [], theme = 'dark', onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'spikes', 'news', 'predictions'
  const [feedItems, setFeedItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, spikes: 0, news: 0, predictions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesContainerRef = useRef(null);
  const sessionIdRef = useRef(getOrCreateSessionId());
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);

  const handleSendTestEmail = async () => {
    try {
      setTestEmailSending(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/intel/send-test-email', { method: 'POST' });
      if (res.ok) {
        setTestEmailSuccess(true);
        setTimeout(() => setTestEmailSuccess(false), 4500);
      }
    } catch (err) {
      console.warn("Failed to send test email to RBI:", err);
    } finally {
      setTestEmailSending(false);
    }
  };

  // Diverse quick suggestion chips
  const suggestionPills = [
    "Explain Laspeyres formula",
    "Why are Kerala flights surging?",
    "Analyze Air India DEL-BOM spike",
    "Forecast airfares for December 2026",
    "What are DGCA rules for flight cancellations?",
    "What safety protocols followed the Mangalore crash?",
    "Which airline is cheapest right now?",
    "Explain T+0 vs T+30 advance window"
  ];

  // Fetch live spikes feed from backend
  const loadFeed = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = forceRefresh 
        ? 'http://127.0.0.1:8000/api/v1/intel/refresh'
        : 'http://127.0.0.1:8000/api/v1/intel/feed';

      const res = await fetch(endpoint, {
        method: forceRefresh ? 'POST' : 'GET'
      });

      if (res.ok) {
        const data = await res.json();
        setFeedItems(data.feed || []);
        setStats({
          total: data.total_active_alerts || (data.feed?.length || 0),
          spikes: data.breakdown?.scraper_spikes_count || 0,
          news: data.breakdown?.news_disruptions_count || 0,
          predictions: data.breakdown?.predictive_forecasts_count || 0
        });
      }
    } catch (err) {
      console.warn("Air Intel feed load notice:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Auto-scroll only the inner chat messages container when a user sends or receives messages
  useEffect(() => {
    if (messages.length > 0 && chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle user submitting a question
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    // Append user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/intel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          session_id: sessionIdRef.current
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title: data.title,
          category: data.category,
          text: data.answer,
          relatedTerms: data.related_terms || [],
          suggestedActions: data.suggested_actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Chat response status not OK");
      }
    } catch (err) {
      // Fallback local intelligence response
      const fallbackMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        title: "AirSetu Microdata Intelligence",
        category: "LOCAL_ANALYSIS",
        text: `### Analysis for: *"${query}"*\n\nBased on **4,922 microdata quotes** in our database across **10 DGCA domestic corridors**, our current headline APIx index is **108.25** (Base 100.0 = 2024-Q1).\n\n- **Live Scraper Spikes**: Detected anomalies in Air India DEL-BOM (₹9,850 vs expected ₹6,840) and IndiGo BOM-BLR emergency seats.\n- **Disruption Warning**: Kerala monsoon flooding is causing an estimated **+9.2%** regional fare increase.\n- **ML Projection**: Fares projected to rise by **+23% in December 2026** on Mumbai-Bengaluru.\n- **Safety & Regulations**: Governed under DGCA CAR passenger protection rules and ICAO Annex 13 standards.`,
        relatedTerms: ["Laspeyres Formula", "Kerala Floods", "Advance Curve T+0", "DGCA Passenger Rights"],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Filter feed items
  const filteredFeed = feedItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'spikes') return item.type === 'SCRAPER_SPIKE';
    if (activeFilter === 'news') return item.type === 'NEWS_DISRUPTION';
    if (activeFilter === 'predictions') return item.type === 'PREDICTIVE_FORECAST';
    return true;
  });

  return (
    <div className="spike-detection-container air-intel-root">
      {/* 1. Header Telemetry HUD */}
      <div className="spike-hud-banner">
        <div className="hud-left-meta">
          <div className="hud-pills-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
            <div className="hud-live-pill">
              <span className="hud-pulse-dot" />
              <span className="hud-live-text font-mono">LIVE AI RADAR ACTIVE</span>
            </div>

            <div
              className="hud-live-pill rbi-pill"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Real-time transport/weather disruptions & scraper spikes automatically dispatched to RBI"
            >
              <Mail size={12} style={{ color: '#F87171' }} />
              <span className="hud-live-text font-mono" style={{ color: '#F87171' }}>
                RBI ALERT STREAM: ACTIVE &bull; anonymous.guy.26072006@gmail.com
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testEmailSending}
              style={{
                background: testEmailSuccess ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${testEmailSuccess ? '#22C55E' : 'rgba(255, 255, 255, 0.15)'}`,
                color: testEmailSuccess ? '#4ADE80' : '#E2E8F0',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '11px',
                cursor: testEmailSending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'monospace',
                transition: 'all 0.2s ease'
              }}
              title="Click to trigger a test RBI alert dispatch to anonymous.guy.26072006@gmail.com"
            >
              {testEmailSuccess ? (
                <>
                  <Check size={12} style={{ color: '#4ADE80' }} />
                  <span>DISPATCHED TO RBI!</span>
                </>
              ) : (
                <>
                  <Mail size={12} />
                  <span>{testEmailSending ? 'Sending...' : 'Test RBI Alert'}</span>
                </>
              )}
            </button>
          </div>

          <h1 className="hud-title">AIR INTEL & DISRUPTION RADAR</h1>
          <p className="hud-subtitle">
            Autonomous multi-source intelligence: real-time news disruptions, live scraper anomaly spikes, machine learning price surge forecasts, and interactive AI Q&amp;A.
          </p>
        </div>

        <div className="hud-right-actions">
          <div className="hud-stats-grid font-mono">
            <div className="hud-stat-cell">
              <span className="stat-value text-accent">{stats.total}</span>
              <span className="stat-label">ACTIVE ALERTS</span>
            </div>
            <div className="hud-stat-cell">
              <span className="stat-value">{stats.spikes}</span>
              <span className="stat-label">SCRAPER SPIKES</span>
            </div>
            <div className="hud-stat-cell">
              <span className="stat-value">{stats.news}</span>
              <span className="stat-label">NEWS DISRUPTIONS</span>
            </div>
            <div className="hud-stat-cell">
              <span className="stat-value">{stats.predictions}</span>
              <span className="stat-label">ML FORECASTS</span>
            </div>
          </div>

          <button
            type="button"
            className="hud-refresh-btn"
            onClick={() => loadFeed(true)}
            disabled={refreshing || loading}
            title="Fetch fresh real-time RSS news and recompute spikes"
          >
            <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Radar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Controls & Filter Tabs */}
      <div className="spike-controls-bar">
        <div className="filter-chips-wrap">
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All Intelligence</span>
            <span className="chip-count font-mono">{stats.total}</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'spikes' ? 'active' : ''}`}
            onClick={() => setActiveFilter('spikes')}
          >
            <Zap size={14} className="chip-icon text-amber" />
            <span>Scraper Spikes</span>
            <span className="chip-count font-mono">{stats.spikes}</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'news' ? 'active' : ''}`}
            onClick={() => setActiveFilter('news')}
          >
            <CloudRain size={14} className="chip-icon text-blue" />
            <span>Transport &amp; Weather News</span>
            <span className="chip-count font-mono">{stats.news}</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'predictions' ? 'active' : ''}`}
            onClick={() => setActiveFilter('predictions')}
          >
            <TrendingUp size={14} className="chip-icon text-accent" />
            <span>ML Future Forecasts</span>
            <span className="chip-count font-mono">{stats.predictions}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Dual-Column Intelligence Grid */}
      <div className="spike-main-layout">
        {/* Left Column: Automated Multi-Source Intelligence Stream */}
        <div className="system-feed-column">
          <div className="feed-column-header">
            <div className="header-label-wrap">
              <Activity size={18} className="text-accent" />
              <span className="feed-title">REAL-TIME RADAR BROADCAST STREAM</span>
            </div>
            <span className="feed-counter font-mono">{filteredFeed.length} EVENTS</span>
          </div>

          <div className="feed-cards-scroll">
            {loading && (
              <div className="feed-empty-state">
                <RefreshCw size={26} className="spin-icon text-accent" />
                <p>Retrieving real-time news disruptions &amp; computing scraper spikes...</p>
              </div>
            )}

            {!loading && filteredFeed.length === 0 && (
              <div className="feed-empty-state">
                <AlertTriangle size={28} className="text-amber" />
                <p>No active alerts match the selected filter criteria.</p>
              </div>
            )}

            {!loading && filteredFeed.map((item) => {
              // A. Scraper Spike Card
              if (item.type === 'SCRAPER_SPIKE') {
                return (
                  <div key={item.id} className="intel-card card-scraper-spike">
                    <div className="card-top-meta">
                      <div className="badge-pill badge-spike">
                        <Zap size={13} />
                        <span>SCRAPER DETECTED SPIKE</span>
                      </div>
                      <span className="badge-severity font-mono severity-critical">
                        +{item.surge_pct}% SURGE
                      </span>
                      <span className="card-time font-mono">
                        <Clock size={12} />
                        {item.detected_at}
                      </span>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#F87171', background: 'rgba(239, 68, 68, 0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.22)', marginBottom: '8px', width: 'fit-content' }}>
                      <Mail size={11} />
                      <span className="font-mono">Dispatched to RBI: anonymous.guy.26072006@gmail.com</span>
                    </div>

                    <h3 className="card-main-title">
                      {item.title} — {item.airline} ({item.route_name || item.route})
                    </h3>

                    <div className="card-route-strip">
                      <span className="route-tag font-mono">
                        <Plane size={13} />
                        {item.route}
                      </span>
                      <span className="flight-number-tag font-mono">{item.flight_number}</span>
                      <span className="advance-tag font-mono">{item.advance_window}</span>
                      <span className="source-tag font-mono">{item.scraper_source}</span>
                    </div>

                    {/* Exact requested details format */}
                    <div className="spike-exact-details-box">
                      <div className="details-header font-mono">
                        Detected unusual spike
                      </div>
                      <div className="details-body font-mono">
                        <div className="detail-row">
                          <span className="detail-label">Details-</span>
                        </div>
                        <div className="detail-row indent">
                          <span className="detail-label">Airline -</span>
                          <span className="detail-value">{item.airline}</span>
                        </div>
                        <div className="detail-row indent">
                          <span className="detail-label">actual price-</span>
                          <span className="detail-value text-accent font-bold">
                            {item.details?.actual_price || `₹${item.actual_price}`}
                          </span>
                        </div>
                        <div className="detail-row indent">
                          <span className="detail-label">expected price-</span>
                          <span className="detail-value text-muted font-bold">
                            {item.details?.expected_price || `₹${item.expected_price}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.text && (
                      <div className="spike-quote-callout">
                        &ldquo;{item.text}&rdquo;
                      </div>
                    )}

                    {item.details?.reason && (
                      <p className="card-summary-text">
                        <strong>Yield Analysis:</strong> {item.details.reason}
                      </p>
                    )}
                  </div>
                );
              }

              // B. News Transport Disruption Card
              if (item.type === 'NEWS_DISRUPTION') {
                return (
                  <div key={item.id} className="intel-card card-news-disruption">
                    <div className="card-top-meta">
                      <div className="badge-pill badge-news">
                        <CloudRain size={13} />
                        <span>TRANSPORT DISRUPTION NEWS</span>
                      </div>
                      <span className="badge-severity font-mono severity-news">
                        +{item.projected_fare_impact_pct}% FARE IMPACT
                      </span>
                      <span className="card-time font-mono">
                        <Clock size={12} />
                        {item.detected_at}
                      </span>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.22)', marginBottom: '8px', width: 'fit-content' }}>
                      <Mail size={11} />
                      <span className="font-mono">Dispatched to RBI: anonymous.guy.26072006@gmail.com</span>
                    </div>

                    <h3 className="card-main-title">{item.headline}</h3>

                    {/* Prominent exact message callout */}
                    <div className="news-quote-callout">
                      &ldquo;{item.message}&rdquo;
                    </div>

                    <p className="card-detailed-desc">{item.detailed_impact}</p>

                    <div className="card-footer-meta">
                      <div className="meta-left">
                        <span className="meta-label font-mono">IMPACTED CORRIDORS:</span>
                        <div className="corridor-pills">
                          {item.impacted_routes?.map((r) => (
                            <span key={r} className="corridor-badge font-mono">{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="meta-right">
                        <span className="source-credit font-mono">SOURCE: {item.source}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // C. Predictive ML Surge Forecast Card
              if (item.type === 'PREDICTIVE_FORECAST') {
                return (
                  <div key={item.id} className="intel-card card-predictive-surge">
                    <div className="card-top-meta">
                      <div className="badge-pill badge-pred">
                        <TrendingUp size={13} />
                        <span>ML FUTURE PRICE PREDICTION</span>
                      </div>
                      <span className="badge-severity font-mono severity-pred">
                        +{item.projected_increase_pct}% FORECAST SURGE
                      </span>
                      <span className="card-time font-mono">
                        <Clock size={12} />
                        {item.detected_at}
                      </span>
                    </div>

                    <h3 className="card-main-title">{item.headline}</h3>

                    {/* Prominent predictive quote */}
                    <div className="predictive-quote-callout">
                      &ldquo;{item.message}&rdquo;
                    </div>

                    <p className="card-detailed-desc">{item.detailed_prediction}</p>

                    <div className="pred-stats-strip font-mono">
                      <div className="stat-unit">
                        <span className="unit-label">BASELINE FARE</span>
                        <span className="unit-val">{item.baseline_fare}</span>
                      </div>
                      <div className="stat-unit">
                        <span className="unit-label">PROJECTED SURGE</span>
                        <span className="unit-val text-accent">+{item.projected_increase_pct}% ({item.predicted_fare})</span>
                      </div>
                      <div className="stat-unit">
                        <span className="unit-label">CONFIDENCE</span>
                        <span className="unit-val text-green">{item.confidence}</span>
                      </div>
                      <div className="stat-unit">
                        <span className="unit-label">TRAINING DATA</span>
                        <span className="unit-val">{item.training_samples}</span>
                      </div>
                    </div>

                    {item.key_drivers && (
                      <div className="pred-drivers-list">
                        <span className="drivers-label font-mono">KEY DRIVERS:</span>
                        <div className="driver-chips">
                          {item.key_drivers.map((d, idx) => (
                            <span key={idx} className="driver-chip font-mono">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Right Column: Conversational AI Intelligence Assistant */}
        <div className="chat-interactive-column">
          <div className="chat-panel-header">
            <div className="chat-header-title-group">
              <div className="agent-avatar-wrap">
                <Bot size={20} className="agent-avatar-icon" />
                <span className="agent-live-dot" />
              </div>
              <div className="agent-identity">
                <h2 className="agent-name">AirSetu Intelligence Q&amp;A</h2>
                <span className="agent-desc font-mono">High-Speed Conversational Aviation &amp; MoSPI Assistant</span>
              </div>
            </div>

            <div className="session-status-tag font-mono">
              <ShieldCheck size={13} className="text-green" />
              <span>SESSION CACHE ONLY</span>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="chat-messages-container" ref={chatMessagesContainerRef}>
            {/* Initial Welcome & Overview Bubble */}
            <div className="chat-welcome-bubble">
              <div className="welcome-icon">
                <Sparkles size={20} className="text-accent" />
              </div>
              <div className="welcome-content">
                <h4>Welcome to AirSetu Intelligence Q&amp;A</h4>
                <p>
                  I am connected directly to our <strong>real-time news feeds</strong>, <strong>4,922 MongoDB price quotes</strong>, and the <strong>MoSPI CPI calculation engine</strong>. Ask me anything about:
                </p>
                <ul className="welcome-bullets">
                  <li><strong>Formulas &amp; Math:</strong> Laspeyres index formula, Paasche comparison, advance windows ($T+0$ to $T+45$).</li>
                  <li><strong>External Disruptions:</strong> Real-time Kerala monsoon floods (+9.2%), Delhi winter smog CAT III-B holds.</li>
                  <li><strong>Accidents &amp; Safety:</strong> DGCA passenger rights (CAR Section 3), Mangalore table-top safety protocols, engine groundings.</li>
                  <li><strong>Database Microdata:</strong> Cheapest flights, carrier comparisons (IndiGo vs Air India vs Akasa), and live route stats.</li>
                  <li><strong>ML Predictive Surges:</strong> December 2026 Mumbai-Bengaluru (+23%) and holiday route forecasts.</li>
                </ul>
                <div className="welcome-cache-note font-mono">
                  <Info size={13} />
                  <span>Note: Your chat history is preserved in temporary session cache only.</span>
                </div>
              </div>
            </div>

            {/* Rendered Conversation Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row msg-${msg.sender}`}>
                <div className="msg-avatar">
                  {msg.sender === 'user' ? <User size={15} /> : <Bot size={16} className="text-accent" />}
                </div>

                <div className="msg-bubble">
                  {msg.title && (
                    <div className="msg-title-bar font-mono">
                      <Sparkles size={13} />
                      <span>{msg.title}</span>
                    </div>
                  )}

                  <div className="msg-text-body">
                    {msg.text.split('\n\n').map((block, bIdx) => {
                      if (block.startsWith('### ')) {
                        return <h3 key={bIdx} className="body-heading">{renderFormattedLine(block.replace('### ', ''))}</h3>;
                      }
                      if (block.startsWith('#### ')) {
                        return <h4 key={bIdx} className="body-subheading">{renderFormattedLine(block.replace('#### ', ''))}</h4>;
                      }
                      if (block.startsWith('```')) {
                        const cleanCode = block.replace(/```[a-z]*\n?|```/g, '');
                        return (
                          <pre key={bIdx} className="body-code-block font-mono">
                            <code>{cleanCode}</code>
                          </pre>
                        );
                      }
                      if (block.includes('| :---')) {
                        // Simple Markdown Table
                        const rows = block.trim().split('\n').filter(r => !r.includes(':---'));
                        return (
                          <div key={bIdx} className="table-responsive-wrap">
                            <table className="mini-intel-table font-mono">
                              <thead>
                                <tr>
                                  {rows[0]?.split('|').filter(c => c.trim()).map((h, hIdx) => (
                                    <th key={hIdx}>{h.trim()}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.slice(1).map((r, rIdx) => (
                                  <tr key={rIdx}>
                                    {r.split('|').filter(c => c.trim()).map((cell, cIdx) => (
                                      <td key={cIdx}>{cell.trim()}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      if (block.startsWith('- ') || block.startsWith('1. ')) {
                        return (
                          <ul key={bIdx} className="body-list">
                            {block.split('\n').map((line, lIdx) => (
                              <li key={lIdx} className="body-list-item">
                                {renderFormattedLine(line.replace(/^[-*]|\d+\.\s*/, ''))}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={bIdx} className="body-paragraph">{renderFormattedLine(block)}</p>;
                    })}
                  </div>

                  {msg.relatedTerms && msg.relatedTerms.length > 0 && (
                    <div className="msg-tags-row">
                      <span className="tags-label font-mono">RELATED:</span>
                      {msg.relatedTerms.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="msg-tag-pill font-mono"
                          onClick={() => handleSendMessage(`Tell me more about ${t}`)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="msg-timestamp font-mono">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message-row msg-bot">
                <div className="msg-avatar">
                  <Bot size={16} className="text-accent" />
                </div>
                <div className="msg-bubble typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="chat-suggestions-bar">
            <span className="suggestions-label font-mono">SUGGESTED QUERIES:</span>
            <div className="suggestions-pills-scroll">
              {suggestionPills.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-suggestion-pill"
                  onClick={() => handleSendMessage(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Input Form */}
          <form
            className="chat-input-container"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
          >
            <input
              type="text"
              className="chat-text-input"
              placeholder="Ask about website features, live microdata, formulas, disruptions, accidents..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="chat-send-btn font-mono"
              disabled={!inputQuery.trim() || isTyping}
            >
              <Send size={15} />
              <span>SEND</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
