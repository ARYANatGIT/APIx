import React from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import {
  ArrowLeft,
  LayoutDashboard,
  Compass,
  TrendingUp,
  Clock,
  Plane,
  FileSearch,
  Cpu,
  Download,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  onBookClick,
  activeTab = 'deck',
  onNavigate,
  latestIndex = 138.08,
  changePct = 1.68,
  theme = 'dark',
  onThemeChange
}) {
  const navItems = [
    { id: 'deck', label: 'FLIGHT DECK', icon: LayoutDashboard },
    { id: 'routes', label: 'ROUTE BASKET', icon: Compass },
    { id: 'trajectory', label: 'INDEX TREND', icon: TrendingUp },
    { id: 'windows', label: 'ADVANCE CURVE', icon: Clock },
    { id: 'airlines', label: 'AIRLINES & OTAs', icon: Plane },
    { id: 'quotes', label: 'LIVE QUOTES', icon: FileSearch },
    { id: 'scraper', label: 'CRAWLER HEALTH', icon: Cpu },
    { id: 'export', label: 'NSO EXPORT', icon: Download }
  ];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    if (onNavigate) onNavigate(item.id);
  };

  const formattedChange = typeof changePct === 'number'
    ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
    : (changePct || '+0.22%');

  return (
    <aside className="left-sidebar-nav">
      <div className="sidebar-top-section">
        {/* Brand Logo */}
        <div className="sidebar-brand-wrapper">
          <Logo onClick={() => onNavigate && onNavigate('home')} />
        </div>

        {/* Theme Toggle (Dark & Light Mode Buttons) */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '2px 0' }}>
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} size="compact" />
        </div>

        {/* Back to Home Landing Screen Action */}
        <button
          type="button"
          className="sidebar-back-home-btn"
          onClick={() => onNavigate && onNavigate('home')}
          aria-label="Back to Home Landing Screen"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          <span>RETURN TO POSTER</span>
        </button>

        {/* Live Index Ticker Card - Sharp 0px Mono Box */}
        <div className="sidebar-ticker-card">
          <div className="ticker-live-row">
            <span className="ticker-live-dot"></span>
            <span className="sidebar-ticker-label">AIRSETU APIx</span>
            <span className="sidebar-ticker-chg font-mono">{formattedChange}</span>
          </div>
          <div className="ticker-val-row">
            <span className="sidebar-ticker-val font-mono">{typeof latestIndex === 'number' ? latestIndex.toFixed(2) : latestIndex}</span>
            <span className="sidebar-ticker-sub font-mono">BASE 100.0</span>
          </div>
        </div>
      </div>

      {/* Navigation List on Left Side */}
      <nav className="sidebar-nav-menu">
        <div className="sidebar-section-label">MONITORING ARCHITECTURE</div>
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className="sidebar-nav-item">
                <button
                  type="button"
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleNavClick(e, item)}
                  aria-label={`Go to ${item.label}`}
                >
                  <Icon size={16} strokeWidth={1.5} className="sidebar-btn-icon" />
                  <span className="sidebar-btn-text">{item.label}</span>
                  {isActive && <span className="active-sharp-indicator"></span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer Action */}
      <div className="sidebar-bottom-section">
        <button
          type="button"
          className="sidebar-inspect-btn"
          onClick={onBookClick}
          aria-label="Inspect APIx Calculation"
        >
          <Sparkles size={14} strokeWidth={1.5} />
          <span>INSPECT APIx ENGINE</span>
        </button>

        <div className="sidebar-footer-note">
          <span>AirSetu • MoSPI CPI</span>
          <span className="sidebar-ver-tag">REV 2026.09</span>
        </div>
      </div>
    </aside>
  );
}
