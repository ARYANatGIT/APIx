import React, { useState, useEffect, useCallback } from 'react';
import Logo from './components/Logo';
import Navbar from './components/Navbar';
import HeroTitle from './components/HeroTitle';
import FeatureBadge from './components/FeatureBadge';
import BookingBar from './components/BookingBar';
import BookingModal from './components/BookingModal';
import Grainient from './components/Grainient';
import MapModal from './components/MapModal';
import IndiaRouteMap from './components/IndiaRouteMap';
import IndexTrendChart from './components/IndexTrendChart';
import AdvanceWindowsView from './components/AdvanceWindowsView';
import AirlinesView from './components/AirlinesView';
import QuotesExplorer from './components/QuotesExplorer';
import ScraperHealthView from './components/ScraperHealthView';
import NsoExportView from './components/NsoExportView';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Compass,
  TrendingUp,
  Clock,
  Plane,
  FileSearch,
  Cpu,
  Download,
  RefreshCw
} from 'lucide-react';

import { apiService, FALLBACK_ROUTES, FALLBACK_AIRLINES, FALLBACK_WINDOWS, FALLBACK_INDEX_SERIES, FALLBACK_LOGS } from './services/api';
import AnimatedBorderFrame from './components/AnimatedBorderFrame';
import planeBg from './assets/plane-hero.jpg';
import './App.css';

function App() {
  // Navigation State: 'home' | 'deck' | 'routes' | 'trajectory' | 'windows' | 'airlines' | 'quotes' | 'scraper' | 'export'
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (['deck', 'routes', 'trajectory', 'windows', 'airlines', 'quotes', 'scraper', 'export'].includes(hash)) {
      return hash;
    }
    return 'home';
  });

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = tabId;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['deck', 'routes', 'trajectory', 'windows', 'airlines', 'quotes', 'scraper', 'export'].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Airfare Price Index Query State
  const [selectedRoute, setSelectedRoute] = useState({
    code: 'DEL ✈ BOM',
    route_code: 'DEL-BOM',
    name: 'Delhi (DEL) → Mumbai (BOM)',
    trafficWeight: '22.35% DGCA Basket',
    avgFare: '₹6,840',
    distance: 1148,
    pax: '7,420,000'
  });
  const [advanceWindow, setAdvanceWindow] = useState('T+7 Days');
  const [indexFrequency, setIndexFrequency] = useState('Daily Real-time');
  const [dataSource, setDataSource] = useState('5 Airlines + 2 OTAs');

  // Motion & Modal state
  const [isFlightActive, setIsFlightActive] = useState(true);
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Backend Data States
  const [overviewData, setOverviewData] = useState(null);
  const [routes, setRoutes] = useState(FALLBACK_ROUTES);
  const [airlines, setAirlines] = useState(FALLBACK_AIRLINES);
  const [windowsData, setWindowsData] = useState(FALLBACK_WINDOWS);
  const [indexSeries, setIndexSeries] = useState(FALLBACK_INDEX_SERIES);
  const [scraperLogs, setScraperLogs] = useState(FALLBACK_LOGS);

  // Real-time synchronization state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Master refresh function to update entire frontend data suite from backend
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [overview, routesData, airlinesData, windows, series, logs] = await Promise.all([
        apiService.getOverview(),
        apiService.getRoutes(),
        apiService.getAirlines(),
        apiService.getAdvanceWindows(),
        apiService.getIndexSeries(),
        apiService.getScraperLogs()
      ]);
      if (overview) setOverviewData(overview);
      if (routesData && routesData.length > 0) setRoutes(routesData);
      if (airlinesData && airlinesData.length > 0) setAirlines(airlinesData);
      if (windows && windows.length > 0) setWindowsData(windows);
      if (series && series.length > 0) setIndexSeries(series);
      if (logs && logs.length > 0) setScraperLogs(logs);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error("Error refreshing whole frontend data:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load + automatic 30s background sync
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 30000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Synchronize active corridor details from live backend route data
  useEffect(() => {
    if (routes && routes.length > 0) {
      const active = routes.find(r => r.route_code === selectedRoute.route_code) || routes[0];
      setSelectedRoute({
        code: `${active.origin_code} ✈ ${active.destination_code}`,
        route_code: active.route_code,
        name: `${active.origin_city} (${active.origin_code}) → ${active.destination_city} (${active.destination_code})`,
        trafficWeight: active.weight_pct_str ? `${active.weight_pct_str} DGCA Basket` : `${(active.weight * 100).toFixed(2)}% DGCA Basket`,
        avgFare: `₹${Math.round(active.average_fare || 6675).toLocaleString()}`,
        distance: active.distance_km,
        pax: (active.annual_passengers || 7420000).toLocaleString()
      });
    }
  }, [routes]);

  const handleOpenIndexModal = () => {
    setIsIndexModalOpen(true);
  };

  const handleSelectRouteFromMap = (routeObj) => {
    setSelectedRoute({
      code: `${routeObj.origin_code} ✈ ${routeObj.destination_code}`,
      route_code: routeObj.route_code,
      name: `${routeObj.origin_city} (${routeObj.origin_code}) → ${routeObj.destination_city} (${routeObj.destination_code})`,
      trafficWeight: routeObj.weight_pct_str ? `${routeObj.weight_pct_str} DGCA Basket` : `${(routeObj.weight * 100).toFixed(2)}% DGCA Basket`,
      avgFare: `₹${Math.round(routeObj.average_fare || 6500).toLocaleString()}`,
      distance: routeObj.distance_km,
      pax: (routeObj.annual_passengers || 0).toLocaleString()
    });
  };

  // Intro Animation State: 'bg-only' -> 'border-drawing' -> 'revealing-elements' -> 'done'
  const [introDone, setIntroDone] = useState(false);
  const [introBorderComplete, setIntroBorderComplete] = useState(false);
  const [introKey, setIntroKey] = useState(0);

  useEffect(() => {
    if (activeTab === 'home' && !introDone) {
      // Border line draws from ~0.1s to ~1.2s (1.1s duration)
      const borderTimer = setTimeout(() => {
        setIntroBorderComplete(true);
      }, 1250);

      // Elements finish popping up by ~2.3s
      const finishTimer = setTimeout(() => {
        setIntroDone(true);
      }, 2350);

      return () => {
        clearTimeout(borderTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [activeTab, introDone, introKey]);

  const handleBorderComplete = useCallback(() => {
    setIntroBorderComplete(true);
  }, []);

  const handleReplayIntro = () => {
    setIntroBorderComplete(false);
    setIntroDone(false);
    setIntroKey(prev => prev + 1);
  };

  const latestIndexVal = overviewData?.latest_index?.value || (indexSeries[indexSeries.length - 1]?.index_value || 104.77);
  const isHomeScreen = activeTab === 'home';
  const isDeckScreen = activeTab === 'deck';

  return (
    <div className="harmont-page-root bold-typography-root">
      {/* React Bits Grainient Background on Home Page */}
      {isHomeScreen && (
        <div className="home-grainient-bg" aria-hidden="true">
          <Grainient
            color1="#FF3D00"
            color2="#080808"
            color3="#161616"
            timeSpeed={0.12}
            warpStrength={1.1}
            warpFrequency={4.0}
            warpSpeed={1.0}
            warpAmplitude={50.0}
            blendSoftness={0.08}
            rotationAmount={320.0}
            noiseScale={1.8}
            grainAmount={0.07}
            grainScale={2.5}
            grainAnimated={true}
            contrast={1.3}
            gamma={1.0}
            saturation={1.15}
            zoom={0.9}
            lightMode={false}
          />
        </div>
      )}

      {/* Subtle Typographic Backdrop Watermark Layer */}
      {isHomeScreen && (
        <div className="bold-backdrop-watermark" aria-hidden="true">
          APIx
        </div>
      )}

      {/* Main Viewport Inset Frame - Sharp 0px Border */}
      <div className={`harmont-viewport-frame ${isHomeScreen ? 'home-simple-frame' : 'dashboard-viewport-frame'} ${isHomeScreen && introBorderComplete ? 'border-completed' : ''}`}>
        {/* Animated Sharp Rectangular Border Frame on Home Screen */}
        {isHomeScreen && (
          <AnimatedBorderFrame
            key={`border-${introKey}`}
            isIntroActive={!introDone}
            onBorderComplete={handleBorderComplete}
          />
        )}

        {/* Left Sidebar Navigation (Docked on Left for Deck and all Monitoring views) */}
        {!isHomeScreen && (
          <Navbar
            activeTab={activeTab}
            onNavigate={handleNavigate}
            onBookClick={handleOpenIndexModal}
            latestIndex={latestIndexVal}
          />
        )}

        {/* 1. Home Screen: Editorial Typographic Poster Spread */}
        {isHomeScreen && (
          <div
            key={`home-container-${introKey}`}
            className={`home-simple-container bold-home-container ${!introDone ? 'home-intro-active' : 'home-intro-completed'}`}
          >
            {/* Top Section: Editorial Topbar + Direct Suite Links */}
            <div className="home-top-section">
              <header className="home-simple-topbar bold-home-topbar">
                <Logo onClick={isHomeScreen ? handleReplayIntro : () => handleNavigate('home')} />
                
                <nav className="home-nav-shortcuts">
                  <button type="button" className="home-shortcut-link" onClick={() => handleNavigate('deck')}>
                    FLIGHT DECK
                  </button>
                  <button type="button" className="home-shortcut-link" onClick={() => handleNavigate('trajectory')}>
                    INDEX TREND
                  </button>
                  <button type="button" className="home-shortcut-link" onClick={() => handleNavigate('routes')}>
                    ROUTE BASKET
                  </button>
                  <button type="button" className="home-shortcut-link" onClick={() => handleNavigate('quotes')}>
                    LIVE QUOTES
                  </button>
                </nav>

                <div className="home-agency-pill bold-mono-pill">
                  <span className="accent-square">■</span>
                  <span>MoSPI // HIGH-FREQUENCY INGESTION</span>
                </div>
              </header>

              {/* Massive Typographic Headline */}
              <div className="home-title-top-area">
                <HeroTitle />
              </div>
            </div>

            {/* High-Impact Real-Time Statistics Row */}
            <div className="home-poster-stats-grid">
              <div className="poster-stat-cell">
                <span className="stat-label">DOMESTIC CORRIDORS</span>
                <span className="stat-num text-accent">10</span>
                <span className="stat-sub">High-Density DGCA Routes</span>
              </div>
              <div className="poster-stat-cell">
                <span className="stat-label">ANNUAL PASSENGERS</span>
                <span className="stat-num font-mono">33.2M</span>
                <span className="stat-sub">Tracked Basket Volume</span>
              </div>
              <div className="poster-stat-cell">
                <span className="stat-label">ACTIVE QUOTES</span>
                <span className="stat-num font-mono">
                  {overviewData?.quotes_stats?.total_stored_quotes ? overviewData.quotes_stats.total_stored_quotes.toLocaleString() : '17,452'}
                </span>
                <span className="stat-sub">Scraped Price Corpus</span>
              </div>
              <div className="poster-stat-cell highlight-cell">
                <span className="stat-label">BENCHMARK APIx</span>
                <span className="stat-num text-accent font-mono">
                  {typeof latestIndexVal === 'number' ? latestIndexVal.toFixed(2) : latestIndexVal}
                </span>
                <span className="stat-sub">Base Period 2024-Q1 = 100.00</span>
              </div>
            </div>

            {/* Middle Section: Sharp Modular Booking / Query Bar */}
            <div className="home-query-bar-container">
              <BookingBar
                selectedRoute={selectedRoute}
                setSelectedRoute={setSelectedRoute}
                advanceWindow={advanceWindow}
                setAdvanceWindow={setAdvanceWindow}
                indexFrequency={indexFrequency}
                setIndexFrequency={setIndexFrequency}
                dataSource={dataSource}
                setDataSource={setDataSource}
                onGenerateIndex={handleOpenIndexModal}
                routes={routes}
              />
            </div>

            {/* Bottom Actions Row: Primary Text CTAs */}
            <div className="home-bottom-content bold-home-bottom">
              <div className="home-action-row">
                <button
                  type="button"
                  className="btn-primary-bold"
                  onClick={() => handleNavigate('deck')}
                  aria-label="Access Flight Deck"
                >
                  <span>ACCESS FLIGHT DECK</span>
                  <ArrowRight size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="btn-secondary-bold"
                  onClick={() => handleNavigate('trajectory')}
                  aria-label="View 30-Day Inflation Trajectory"
                >
                  <span>VIEW 30-DAY TRAJECTORY</span>
                </button>
              </div>

              <div className="home-footer-meta" aria-hidden="true">
                <span className="meta-dot">■</span>
                <span>OFFICIAL DGCA PRICE BASKET // MOSPI CPI PLATFORM</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Main Content Area (Dashboard & Analytics Suite on White Background) */}
        {!isHomeScreen && (
          <div className="harmont-content-area">
            {/* Tab 1: Executive Flight Deck (White Dashboard, No Co-relation to Home Screen) */}
            {activeTab === 'deck' && (
              <div className="deck-white-dashboard">
                {/* 1. Header Section */}
                <div className="deck-header-section">
                  <div className="deck-header-left">
                    <div className="deck-header-tag">
                      <span className="live-status-dot"></span>
                      <span>MoSPI Official Airfare Intelligence</span>
                      <span className="deck-version-tag">v2.4.0</span>
                    </div>
                    <h1 className="deck-page-title">Executive Flight Deck</h1>
                    <p className="deck-page-subtitle">
                      Real-time Laspeyres Airfare Price Index (APIx), high-frequency DGCA basket monitoring & multi-source web-scraped microdata.
                    </p>
                  </div>

                  <div className="deck-header-right">
                    <div className="deck-header-status-card">
                      <div className="status-indicator-row">
                        <span className="live-pulse-dot"></span>
                        <span className="status-label">Pipeline Active</span>
                      </div>
                      <div className="status-time">Live Scraped Data</div>
                    </div>

                    <button
                      type="button"
                      className="deck-header-action-btn"
                      style={{
                        background: isRefreshing ? 'rgba(229, 181, 79, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(229, 181, 79, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                      onClick={refreshAllData}
                      title={`Last synced: ${lastRefreshed.toLocaleTimeString()}`}
                    >
                      <RefreshCw size={15} className={isRefreshing ? 'spin-pulse' : ''} />
                      <span>{isRefreshing ? 'Updating...' : 'Sync Scraped Data'}</span>
                    </button>

                    <button
                      type="button"
                      className="deck-header-action-btn"
                      onClick={handleOpenIndexModal}
                    >
                      <Sparkles size={16} />
                      <span>Inspect APIx Calculation</span>
                    </button>
                  </div>
                </div>

                {/* 2. Top Metric KPI Cards (4 Cards Grid) */}
                <div className="deck-kpi-grid">
                  {/* KPI 1 */}
                  <div className="deck-kpi-card highlight-gold">
                    <div className="kpi-card-top">
                      <span className="kpi-label">HEADLINE APIx INDEX</span>
                      <span className="kpi-icon-wrap gold"><TrendingUp size={18} /></span>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-number">{latestIndexVal}</span>
                      <span className="kpi-pill-badge positive">
                        {overviewData?.latest_index?.change_pct_d1 !== undefined ? (overviewData.latest_index.change_pct_d1 >= 0 ? `+${overviewData.latest_index.change_pct_d1}%` : `${overviewData.latest_index.change_pct_d1}%`) : '+0.15%'}
                      </span>
                    </div>
                    <div className="kpi-footer-text">
                      <span>Base {overviewData?.latest_index?.base_period || '2024-Q1'} = 100.00</span>
                      <span className="kpi-bullet">•</span>
                      <span>MoSPI CPI Augmentation</span>
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="deck-kpi-card">
                    <div className="kpi-card-top">
                      <span className="kpi-label">PRIMARY CORRIDOR ANCHOR</span>
                      <span className="kpi-icon-wrap blue"><Compass size={18} /></span>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-text-val">{selectedRoute.code}</span>
                      <span className="kpi-pill-badge neutral">{selectedRoute.trafficWeight || '22.35% Basket'}</span>
                    </div>
                    <div className="kpi-footer-text">
                      <span>Avg Fare: {selectedRoute.avgFare || '₹6,840'}</span>
                      <span className="kpi-bullet">•</span>
                      <span>{selectedRoute.pax || '7.42M'} annual pax</span>
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className="deck-kpi-card">
                    <div className="kpi-card-top">
                      <span className="kpi-label">ADVANCE BOOKING WINDOW</span>
                      <span className="kpi-icon-wrap purple"><Clock size={18} /></span>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-text-val">{advanceWindow}</span>
                      <span className="kpi-pill-badge blue">Spot Curve</span>
                    </div>
                    <div className="kpi-footer-text">
                      <span>6 Horizons: T+0 to T+45 days</span>
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div className="deck-kpi-card">
                    <div className="kpi-card-top">
                      <span className="kpi-label">MICRODATA INGESTION</span>
                      <span className="kpi-icon-wrap green"><Cpu size={18} /></span>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-number">
                        {overviewData?.quotes_stats?.total_stored_quotes ? overviewData.quotes_stats.total_stored_quotes.toLocaleString() : '4,194'}
                      </span>
                      <span className="kpi-pill-badge green">Live MongoDB</span>
                    </div>
                    <div className="kpi-footer-text">
                      <span>
                        {overviewData?.airline_stats ? `${overviewData.airline_stats.carriers_count} Airlines + ${overviewData.airline_stats.otas_count} OTAs` : '5 Airlines + 2 OTAs'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Interactive Corridor Configuration Bar */}
                <div className="deck-search-section">
                  <div className="deck-section-title-row">
                    <div>
                      <h3 className="deck-section-title">Query Corridor Basket & Calculate APIx</h3>
                      <p className="deck-section-desc">Select DGCA corridor, advance horizon, frequency aggregation, and portal sources.</p>
                    </div>
                  </div>
                  <div className="deck-booking-bar-wrapper">
                    <BookingBar
                      selectedRoute={selectedRoute}
                      setSelectedRoute={setSelectedRoute}
                      advanceWindow={advanceWindow}
                      setAdvanceWindow={setAdvanceWindow}
                      indexFrequency={indexFrequency}
                      setIndexFrequency={setIndexFrequency}
                      dataSource={dataSource}
                      setDataSource={setDataSource}
                      onGenerateIndex={handleOpenIndexModal}
                      routes={routes}
                    />
                  </div>
                </div>

                {/* 4. Telemetry & Analytics Grid */}
                <div className="deck-lower-grid">
                  {/* Left Card: Top DGCA Corridors Quick Matrix */}
                  <div className="deck-card corridor-table-card">
                    <div className="deck-card-header">
                      <div>
                        <h4 className="card-heading">DGCA Representative Corridor Basket</h4>
                        <p className="card-subtext">Official passenger traffic weights ($w_r$) and live sector pricing</p>
                      </div>
                      <button
                        type="button"
                        className="deck-link-btn"
                        onClick={() => handleNavigate('routes')}
                      >
                        <span>Full Basket Map</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="deck-mini-table-wrap">
                      <table className="deck-mini-table">
                        <thead>
                          <tr>
                            <th>Corridor</th>
                            <th>Route Name</th>
                            <th>Basket Weight</th>
                            <th>Avg Fare</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {routes.slice(0, 5).map(r => (
                            <tr key={r.route_code} className={r.route_code === selectedRoute.route_code ? 'active-corridor-row' : ''}>
                              <td>
                                <span className="route-tag-pill">{r.route_code}</span>
                              </td>
                              <td>{r.origin_city} ➔ {r.destination_city}</td>
                              <td className="font-semibold text-gold">{(r.weight * 100).toFixed(2)}%</td>
                              <td className="font-mono">₹{Math.round(r.average_fare || 6500).toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-select-deck-route"
                                  onClick={() => handleSelectRouteFromMap(r)}
                                >
                                  {r.route_code === selectedRoute.route_code ? 'Selected' : 'Select'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Card: Quick Laspeyres & Horizon Telemetry */}
                  <div className="deck-card telemetry-insights-card">
                    <div className="deck-card-header">
                      <div>
                        <h4 className="card-heading">Index Telemetry & Advance Horizons</h4>
                        <p className="card-subtext">Laspeyres formulation & dynamic purchase curves</p>
                      </div>
                      <button
                        type="button"
                        className="deck-link-btn"
                        onClick={() => handleNavigate('trajectory')}
                      >
                        <span>Inflation Trend</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Laspeyres Formula Snippet */}
                    <div className="formula-preview-box">
                      <div className="formula-math-text">
                        {'APIx_t = 100 × ∑ [ w_r × ( P_{r,t} / P_{r,0} ) ]'}
                      </div>
                      <div className="formula-caption">
                        Official Laspeyres index algorithm aggregating high-frequency fares across 5 advance purchase horizons (T+1 to T+45).
                      </div>
                    </div>

                    {/* Advance Windows Progress Bars (Live Dynamic from MongoDB) */}
                    <div className="advance-horizons-mini-list">
                      {windowsData.slice(0, 5).map((win, idx) => {
                        const colorClass = idx === 0 ? 'fill-red' : idx === 1 ? 'fill-gold' : idx === 2 ? 'fill-blue' : 'fill-emerald';
                        const maxVal = Math.max(...windowsData.map(w => w.average_fare || 10000), 12000);
                        const pct = Math.min(100, Math.max(20, Math.round(((win.average_fare || 6000) / maxVal) * 100)));
                        const multiplierText = win.surge_multiplier ? ` • ${win.surge_multiplier}x` : '';
                        return (
                          <div className="horizon-item" key={win.advance_window}>
                            <div className="horizon-labels">
                              <span className="h-name">{win.label || win.advance_window}</span>
                              <span className="h-val font-mono">
                                ₹{Math.round(win.average_fare || 6500).toLocaleString()}{multiplierText} • {win.quote_count || 0} quotes
                              </span>
                            </div>
                            <div className="horizon-bar-track">
                              <div className={`horizon-bar-fill ${colorClass}`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: DGCA Route Basket & Interactive Indian Map */}
            {activeTab === 'routes' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <IndiaRouteMap
                    routes={routes}
                    onSelectRoute={handleSelectRouteFromMap}
                    selectedRouteCode={selectedRoute.route_code}
                  />

                  {/* DGCA Normalized Basket Weights Table */}
                  <div className="basket-weights-card">
                    <div className="card-header-flex">
                      <div>
                        <h3 className="subgroup-title">Official DGCA Route Basket & Statistical Weights ($\sum w_r = 1.000000$)</h3>
                        <p className="subgroup-sub">Based on official Directorate General of Civil Aviation domestic passenger traffic statistics.</p>
                      </div>
                      <button className="btn-table-action" onClick={() => setActiveTab('deck')}>
                        Configure in Deck
                      </button>
                    </div>

                    <div className="table-responsive-wrapper">
                      <table className="quotes-table">
                        <thead>
                          <tr>
                            <th>Corridor</th>
                            <th>City Pair</th>
                            <th>Distance (km)</th>
                            <th>Annual Passengers</th>
                            <th>Traffic Share</th>
                            <th>Basket Weight ($w_r$)</th>
                            <th>Avg Sector Fare</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {routes.map((r) => (
                            <tr key={r.route_code} className={r.route_code === selectedRoute.route_code ? 'highlighted-row' : ''}>
                              <td className="font-mono font-bold">
                                <span className="route-badge-sm">{r.route_code}</span>
                              </td>
                              <td>{r.origin_city} ➔ {r.destination_city}</td>
                              <td className="font-mono">{r.distance_km} km</td>
                              <td className="font-mono">{(r.annual_passengers || 0).toLocaleString()}</td>
                              <td className="font-mono">{((r.passenger_share || 0) * 100).toFixed(2)}%</td>
                              <td className="font-bold val-gold">{r.weight_pct_str || `${((r.weight || 0) * 100).toFixed(2)}%`}</td>
                              <td className="font-mono">₹{Math.round(r.average_fare || 6200).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn-select-route-sm"
                                  onClick={() => {
                                    handleSelectRouteFromMap(r);
                                    setIsIndexModalOpen(true);
                                  }}
                                >
                                  Inspect Fares
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: APIx Inflation Trajectory */}
            {activeTab === 'trajectory' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <IndexTrendChart indexSeries={indexSeries} overviewData={overviewData} />

                  <div className="macro-methodology-card">
                    <h3>Laspeyres Formulation & Microdata Ingestion Architecture</h3>
                    <p>
                      The MoSPI Real-time Airfare Price Index is computed utilizing a Laspeyres price index formula augmented by high-frequency scraped microdata:
                    </p>
                    <div className="formula-math-display">
                      {'APIx_t = 100 × ∑ [ w_r × ( P_{r,t} / P_{r,0} ) ]'}
                    </div>
                    <div className="formula-variables-grid">
                      <div className="var-item">
                        <strong>w_r:</strong> Normalized DGCA passenger traffic weight for corridor r (∑ w_r = 1.000000).
                      </div>
                      <div className="var-item">
                        <strong>P_(r,t):</strong> Cleaned weighted average price across all 5 advance booking windows (T+1 to T+45) at time t.
                      </div>
                      <div className="var-item">
                        <strong>P_(r,0):</strong> Base period price anchor established during 2024-Q1 (Base = 100.0).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Advance Purchase Windows */}
            {activeTab === 'windows' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <AdvanceWindowsView windowsData={windowsData} />
                </div>
              </div>
            )}

            {/* Tab 5: Monitored Airlines & OTAs */}
            {activeTab === 'airlines' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <AirlinesView airlines={airlines} />
                </div>
              </div>
            )}

            {/* Tab 6: Live Quotes Explorer & Proof of Source */}
            {activeTab === 'quotes' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <QuotesExplorer refreshTrigger={lastRefreshed} />
                </div>
              </div>
            )}

            {/* Tab 7: Scraper Health & Crawler Logs */}
            {activeTab === 'scraper' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <ScraperHealthView
                    logs={scraperLogs}
                    scraperStats={overviewData?.scraper_health || {}}
                  />
                </div>
              </div>
            )}

            {/* Tab 8: MoSPI / NSO CPI Export */}
            {activeTab === 'export' && (
              <div className="analytics-scroll-container">
                <div className="analytics-inner-wrap">
                  <NsoExportView
                    routes={routes}
                    indexSeries={indexSeries}
                    overviewData={overviewData}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Airfare Price Index & CPI Report Modal */}
      <BookingModal
        isOpen={isIndexModalOpen}
        onClose={() => setIsIndexModalOpen(false)}
        route={selectedRoute}
        advanceWindow={advanceWindow}
        indexFrequency={indexFrequency}
        dataSource={dataSource}
      />

      {/* Flight Radar & ADS-B Telemetry Modal */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </div>
  );
}

export default App;
