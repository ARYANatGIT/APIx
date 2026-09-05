import React, { useState } from 'react';
import Logo from './Logo';

export default function Navbar({ onBookClick, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Airfare Index');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = ['Airfare Index', 'Sector Baskets', 'Advance Windows', 'Airlines & OTAs', 'NSO / RBI API'];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setActiveTab(item);
    if (onNavigate) onNavigate(item);
    setMobileMenuOpen(false);
  };

  return (
    <header className="hero-navbar">
      <div className="nav-left">
        <Logo />
      </div>

      <nav className={`nav-center ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className={`nav-link ${activeTab === item ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, item)}
              >
                {activeTab === item && <span className="active-dot">•</span>}
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="nav-right">
        <button
          className="btn-book-now"
          onClick={onBookClick}
          aria-label="Access APIx Dashboard"
        >
          APIx Portal
        </button>

        {/* Mobile Hamburger toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>
    </header>
  );
}
