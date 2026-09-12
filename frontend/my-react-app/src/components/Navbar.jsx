import React from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import VolumeReaderButton from './VolumeReaderButton';
import SearchNavButton from './SearchNavButton';
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
  Sparkles,
  X
} from 'lucide-react';

export default function Navbar({
  onBookClick,
  onSearchClick,
  activeTab = 'deck',
  onNavigate,
  latestIndex = 138.08,
  changePct = 1.68,
  theme = 'dark',
  onThemeChange,
  isMobileOpen = false,
  onCloseMobile
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
    if (onCloseMobile) onCloseMobile();
  };

  const handleBackHome = () => {
    if (onNavigate) onNavigate('home');
    if (onCloseMobile) onCloseMobile();
  };

  const handleInspect = () => {
    if (onBookClick) onBookClick();
    if (onCloseMobile) onCloseMobile();
  };

  const formattedChange = typeof changePct === 'number'
    ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
    : (changePct || '+0.22%');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-mobile-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`left-sidebar-nav ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>

        <div className="sidebar-top-section">
          {/* Brand Logo */}
          <div className="sidebar-brand-wrapper">
            <Logo onClick={handleBackHome} />
          </div>

          {/* Controls: Search, Theme Toggle & Volume Read-Aloud Button */}
          <div className="sidebar-controls-row">
            <SearchNavButton onClick={onSearchClick} size="compact" />
            <ThemeToggle theme={theme} onThemeChange={onThemeChange} size="compact" />
            <VolumeReaderButton activeTab={activeTab} size="compact" />
          </div>

          {/* Back to Home Landing Screen Action */}
          <button
            type="button"
            className="sidebar-back-home-btn"
            onClick={handleBackHome}
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
            onClick={handleInspect}
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
    </>
  );
}
