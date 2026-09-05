import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroTitle from './components/HeroTitle';
import FeatureBadge from './components/FeatureBadge';
import BookingBar from './components/BookingBar';
import BookingModal from './components/BookingModal';
import planeBg from './assets/plane-hero.jpg';
import './App.css';

function App() {
  // Airfare Price Index State
  const [selectedRoute, setSelectedRoute] = useState({
    code: 'DEL ✈ BOM',
    name: 'Delhi (DEL) → Mumbai (BOM)',
    trafficWeight: '18.4% DGCA Basket',
    avgFare: '₹5,820'
  });
  const [advanceWindow, setAdvanceWindow] = useState('T+7 Days');
  const [indexFrequency, setIndexFrequency] = useState('Daily Real-time');
  const [dataSource, setDataSource] = useState('5 Airlines + 6 OTAs');

  // Motion state
  const [isFlightActive, setIsFlightActive] = useState(true);

  // Modal state
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);

  const handleOpenIndexModal = () => {
    setIsIndexModalOpen(true);
  };

  return (
    <div
      className={`harmont-page-root flight-page-theme ${isFlightActive ? 'flight-in-motion' : ''}`}
      style={{ backgroundImage: `url(${planeBg})` }}
    >
      {/* Fullscreen atmospheric ambient cloud overlay */}
      <div className="ambient-clouds-layer"></div>
      <div className="frame-overlay-gradient"></div>

      {/* Main Full-Viewport Inset Frame with Rounded White Border */}
      <div className="harmont-viewport-frame">
        {/* Top Navigation */}
        <Navbar
          onBookClick={handleOpenIndexModal}
          onNavigate={(tab) => console.log('Navigate to:', tab)}
        />

        {/* Main Hero Header Title */}
        <HeroTitle />

        {/* Floating Feature Badges over the Airplane Scene */}
        <div className="cabin-feature-badges-layer flight-badges-layer">
          <FeatureBadge
            label="T+1 to T+45 Windows"
            positionClass="badge-pos-left plane-badge-left"
            tooltipText="Advance purchase windows: T+1, T+7, T+15, T+30, T+45 days"
          />
          <FeatureBadge
            label="DGCA Sector Baskets"
            positionClass="badge-pos-top plane-badge-top"
            tooltipText="Representative city-pairs: DEL-BOM, DEL-BLR, BOM-BLR, DEL-CCU, BLR-HYD, MAA-DEL"
          />
          <FeatureBadge
            label="Multi-Source Scraping"
            positionClass="badge-pos-right plane-badge-right"
            tooltipText="Automated scraping across IndiGo, Air India, Akasa, SpiceJet & leading OTAs"
          />
        </div>

        {/* Floating Airfare Price Index (APIx) Query Capsule Bar */}
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
        />
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
    </div>
  );
}

export default App;
