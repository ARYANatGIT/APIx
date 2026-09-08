import React from 'react';
import Logo from './Logo';
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

export default function Navbar({ onBookClick, activeTab = 'deck', onNavigate, latestIndex = 104.77 }) {
  const navItems = [
    { id: 'deck', label: 'Flight Deck', icon: LayoutDashboard },
    { id: 'routes', label: 'Route Basket', icon: Compass },
    { id: 'trajectory', label: 'Index Trend', icon: TrendingUp },
    { id: 'windows', label: 'Advance Windows', icon: Clock },
    { id: 'airlines', label: 'Airlines & OTAs', icon: Plane },
    { id: 'quotes', label: 'Live Quotes', icon: FileSearch },
    { id: 'scraper', label: 'Crawler Health', icon: Cpu },
    { id: 'export', label: 'NSO Export', icon: Download }
  ];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    if (onNavigate) onNavigate(item.id);
  };

  return (
    <aside className="left-sidebar-nav">
      <div className="sidebar-top-section">
        {/* Brand Logo */}
        <div className="sidebar-brand-wrapper">
          <Logo onClick={() => onNavigate && onNavigate('home')} />
        </div>

        {/* Back to Home Landing Screen Action */}
        <button
          type="button"
          className="sidebar-back-home-btn"
          onClick={() => onNavigate && onNavigate('home')}
          aria-label="Back to Home Landing Screen"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>

        {/* Live Index Ticker Card */}
        <div className="sidebar-ticker-card">
          <div className="ticker-live-row">
            <span className="ticker-live-dot"></span>
            <span className="sidebar-ticker-label">APIx Index</span>
            <span className="sidebar-ticker-chg">+0.15%</span>
          </div>
          <div className="ticker-val-row">
            <span className="sidebar-ticker-val">{latestIndex}</span>
            <span className="sidebar-ticker-sub">Base 100.0</span>
          </div>
        </div>
      </div>

      {/* Navigation List on Left Side */}
      <nav className="sidebar-nav-menu">
        <div className="sidebar-section-label">MONITORING SUITE</div>
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
                  <Icon size={17} className="sidebar-btn-icon" />
                  <span className="sidebar-btn-text">{item.label}</span>
                  {isActive && <span className="active-pill-bar"></span>}
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
          <Sparkles size={16} />
          <span>Inspect APIx</span>
        </button>

        <div className="sidebar-footer-note">
          <span>MoSPI CPI Augmentation</span>
          <span className="sidebar-ver-tag">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
