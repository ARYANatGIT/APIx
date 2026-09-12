import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  Clock,
  Car,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { apiService } from '../services/api';

export default function AirportSubstitutionWidget() {
  const [activeTab, setActiveTab] = useState('intelligence'); // 'intelligence' | 'simulation'
  const [substitutionData, setSubstitutionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation Controls State
  const [simHub, setSimHub] = useState('DEL');
  const [simCapacityCut, setSimCapacityCut] = useState(30);
  const [simWeather, setSimWeather] = useState(50);
  const [simDemandSurge, setSimDemandSurge] = useState(25);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const fetchSubstitutionData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAirportSubstitution();
      if (data && data.pairs) {
        setSubstitutionData(data);
      }
    } catch (err) {
      console.error('Failed to fetch airport substitution intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstitutionData();
  }, []);

  const handleRunSimulation = async () => {
    setSimLoading(true);
    try {
      const result = await apiService.runAirportSimulation({
        hub_code: simHub,
        capacity_reduction_pct: simCapacityCut,
        weather_severity_pct: simWeather,
        demand_surge_pct: simDemandSurge
      });
      if (result && result.simulation_results) {
        setSimResult(result);
      }
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // Run initial simulation on load for DEL
  useEffect(() => {
    if (!simResult) {
      handleRunSimulation();
    }
  }, []);

  const pairs = substitutionData?.pairs || [];

  return (
    <div className="airport-sub-widget-container">
      {/* Header with Dual-Mode Tabs */}
      <div className="airport-sub-header">
        <div className="sub-title-wrap">
          <div className="sub-badge-tag font-mono">
            <Compass size={13} />
            <span>CATCHMENT SUBSTITUTION & SCENARIO ENGINE</span>
          </div>
          <h2 className="sub-main-heading">Airport Substitution Intelligence & Operational Simulation</h2>
          <p className="sub-heading-desc">
            Dual-airport catchment price arbitrage, ground-transit trade-offs, and interactive what-if disruption shock modeling for major Indian aviation hubs.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="airport-sub-tab-switch">
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('intelligence')}
          >
            Catchment Substitution Matrix
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            ⚡ Airport Shock Simulator
          </button>
        </div>
      </div>

      {/* MODE 1: Catchment Substitution Intelligence Matrix */}
      {activeTab === 'intelligence' && (
        <div className="substitution-intelligence-view">
          <div className="sub-info-banner font-mono">
            <span>METROPOLITAN DUAL-AIRPORT CATCHMENT ARBITRAGE</span>
            <span className="sub-svi-formula">SVI = Net Savings / Primary Fare - Ground Transit Penalty</span>
          </div>

          <div className="substitution-pairs-grid">
            {pairs.map((p) => {
              const arb = p.arbitrage;
              return (
                <div key={p.pair_id} className="sub-pair-card">
                  <div className="pair-card-header">
                    <span className="pair-region font-mono">{p.region}</span>
                    <span
                      className="pair-svi-badge font-mono"
                      style={{ borderColor: arb.viability_color, color: arb.viability_color }}
                    >
                      SVI {arb.svi_score} • {arb.viability_level}
                    </span>
                  </div>

                  {/* Primary vs Secondary Visual Comparison */}
                  <div className="pair-airports-comparison">
                    {/* Primary Hub */}
                    <div className="airport-col primary-col">
                      <div className="airport-type-tag">PRIMARY HUB</div>
                      <div className="airport-code font-mono">{p.primary.code}</div>
                      <div className="airport-fullname">{p.primary.name}</div>
                      <div className="airport-fare font-mono">₹{p.primary.avg_fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      <span className="fare-sub font-mono">Avg Sector Fare</span>
                    </div>

                    <div className="versus-divider">
                      <span className="vs-circle">VS</span>
                      <ArrowRight size={14} className="vs-arrow" />
                    </div>

                    {/* Secondary Substitute */}
                    <div className="airport-col substitute-col">
                      <div className="airport-type-tag sub-tag">SECONDARY ALTERNATE</div>
                      <div className="airport-code font-mono text-emerald">{p.substitute.code}</div>
                      <div className="airport-fullname">{p.substitute.name}</div>
                      <div className="airport-fare font-mono text-emerald">
                        ₹{p.substitute.avg_fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <span className="fare-sub font-mono text-emerald">
                        Save {arb.savings_pct}%
                      </span>
                    </div>
                  </div>

                  {/* Ground Transit & Net Savings Metrics */}
                  <div className="pair-metrics-strip font-mono">
                    <div className="metric-cell">
                      <Clock size={12} />
                      <span>{p.substitute.transit_time_mins} mins transit</span>
                    </div>
                    <div className="metric-cell">
                      <Car size={12} />
                      <span>{p.substitute.distance_from_hub_km} km surface distance</span>
                    </div>
                    <div className="metric-cell highlight-green">
                      <span>Net Savings: ₹{arb.net_savings_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* Strategic Commuter Advice */}
                  <div className="pair-advice-box">
                    <div className="advice-label font-mono">💡 COMMUTER / AIRLINE RECOMMENDATION</div>
                    <div className="advice-text">{arb.recommendation}</div>
                    <div className="best-for-text">🎯 <strong>Optimal catchment:</strong> {p.substitute.best_for}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: Airport Disruption & Scenario Simulator */}
      {activeTab === 'simulation' && (
        <div className="airport-simulation-view">
          <div className="sim-layout-grid">
            {/* Left Control Panel: Sliders & Parameter Inputs */}
            <div className="sim-controls-panel">
              <div className="controls-header font-mono">
                <Sliders size={14} />
                <span>SCENARIO SHOCK PARAMETERS</span>
              </div>

              {/* Parameter 1: Airport Hub Selector */}
              <div className="control-group">
                <label className="control-label font-mono">TARGET METROPOLITAN HUB</label>
                <div className="hub-chips-row font-mono">
                  {[
                    { code: 'DEL', name: 'Delhi IGI' },
                    { code: 'BOM', name: 'Mumbai CSMI' },
                    { code: 'BLR', name: 'Bengaluru KIA' },
                    { code: 'GOI', name: 'Goa Dabolim' },
                    { code: 'CCU', name: 'Kolkata NSCB' }
                  ].map((hub) => (
                    <button
                      key={hub.code}
                      type="button"
                      className={`hub-chip-btn ${simHub === hub.code ? 'active' : ''}`}
                      onClick={() => setSimHub(hub.code)}
                    >
                      <span className="chip-code">{hub.code}</span>
                      <span className="chip-name">{hub.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter 2: Capacity Reduction Slider */}
              <div className="control-group">
                <div className="slider-label-row font-mono">
                  <span>CAPACITY CONTRACTION (RUNWAY / GATES)</span>
                  <span className="slider-val text-vermillion">-{simCapacityCut}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={simCapacityCut}
                  onChange={(e) => setSimCapacityCut(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="slider-hint">Simulates runway maintenance, ATC flow restrictions, or aircraft groundings.</span>
              </div>

              {/* Parameter 3: Weather Severity Slider */}
              <div className="control-group">
                <div className="slider-label-row font-mono">
                  <span>WEATHER DISRUPTION (FOG / SMOG / MONSOON)</span>
                  <span className="slider-val text-amber">{simWeather}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={simWeather}
                  onChange={(e) => setSimWeather(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="slider-hint">Dense CAT III-B fog, winter low visibility, or monsoon coastal gale delays.</span>
              </div>

              {/* Parameter 4: Demand Surge Slider */}
              <div className="control-group">
                <div className="slider-label-row font-mono">
                  <span>DEMAND SURGE (FESTIVE / HOLIDAY RUSH)</span>
                  <span className="slider-val text-purple">+{simDemandSurge}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={simDemandSurge}
                  onChange={(e) => setSimDemandSurge(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="slider-hint">Spike in holiday travel demand (Diwali, Chhath, Christmas, New Year).</span>
              </div>

              {/* Execute Simulation Button */}
              <button
                type="button"
                className="btn-run-simulation font-mono"
                onClick={handleRunSimulation}
                disabled={simLoading}
              >
                <Play size={14} className={simLoading ? 'spin-pulse' : ''} />
                <span>{simLoading ? 'Computing Scenario Shock...' : 'RUN AIRPORT SHOCK SIMULATION'}</span>
              </button>
            </div>

            {/* Right Output Panel: Projected Shock Outcomes */}
            <div className="sim-results-panel">
              {simResult?.simulation_results ? (
                <>
                  <div className="results-hero-strip">
                    <div className="result-kpi-card fare-shock">
                      <span className="kpi-label font-mono">PROJECTED FARE IMPACT</span>
                      <span className="kpi-num font-mono text-vermillion">
                        +{simResult.simulation_results.projected_fare_impact_pct}%
                      </span>
                      <span className="kpi-sub">Across sectors touching {simResult.hub_code}</span>
                    </div>

                    <div className="result-kpi-card rsi-shock">
                      <span className="kpi-label font-mono">SHOCKED ROUTE STRESS</span>
                      <div className="rsi-shock-transition font-mono">
                        <span className="baseline-rsi">{simResult.simulation_results.baseline_avg_rsi}</span>
                        <ArrowRight size={14} />
                        <span className="shocked-rsi text-vermillion">{simResult.simulation_results.shocked_avg_rsi}</span>
                      </div>
                      <span className="kpi-sub font-mono text-vermillion">
                        {simResult.simulation_results.shock_level} STRESS STATUS
                      </span>
                    </div>

                    <div className="result-kpi-card pax-shock">
                      <span className="kpi-label font-mono">DISPLACED SEAT CAPACITY</span>
                      <span className="kpi-num font-mono text-amber">
                        {simResult.simulation_results.daily_displaced_passengers?.toLocaleString('en-IN')}
                      </span>
                      <span className="kpi-sub">Estimated daily stranded/diverted pax</span>
                    </div>
                  </div>

                  {/* Optimal Substitution Strategy Rerouting Box */}
                  <div className="substitution-recommendation-card">
                    <div className="sub-rec-header font-mono">
                      <ShieldCheck size={16} className="text-emerald" />
                      <span>OPTIMAL CATCHMENT REROUTING MITIGATION</span>
                    </div>
                    <div className="sub-rec-body">
                      <p className="rec-text">{simResult.simulation_results.recommended_substitution?.mitigation_strategy}</p>
                      <div className="rec-badges-row font-mono">
                        <span className="rec-badge primary">Primary Bottleneck: {simResult.simulation_results.recommended_substitution?.primary_hub}</span>
                        <span className="rec-badge alternate">Alternate Hub: {simResult.simulation_results.recommended_substitution?.alternate_hub} ({simResult.simulation_results.recommended_substitution?.alternate_name})</span>
                        <span className="rec-badge time">Ground Transit: {simResult.simulation_results.recommended_substitution?.transit_time_mins} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Corridor Shock Projections Table */}
                  <div className="corridors-shock-table-wrap">
                    <div className="table-header font-mono">
                      <span>PROJECTED SECTOR-BY-SECTOR DISRUPTION ({simResult.hub_code} CORRIDORS)</span>
                    </div>
                    <table className="sim-corridors-table font-mono">
                      <thead>
                        <tr>
                          <th>CORRIDOR</th>
                          <th>BASELINE FARE</th>
                          <th>SHOCKED FARE</th>
                          <th>BASELINE RSI</th>
                          <th>SHOCKED RSI</th>
                          <th>RISK TIER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simResult.simulation_results.corridor_projections?.map((cp) => (
                          <tr key={cp.route_code}>
                            <td className="corridor-cell font-bold">{cp.route_code}</td>
                            <td>₹{cp.baseline_fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="text-vermillion font-bold">
                              ₹{cp.projected_fare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td>{cp.baseline_rsi?.toFixed(1)}</td>
                            <td className="text-vermillion font-bold">{cp.shocked_rsi?.toFixed(1)}</td>
                            <td>
                              <span className="table-risk-pill" style={{ borderColor: cp.color, color: cp.color }}>
                                {cp.level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="sim-placeholder-wrap">
                  <div className="loading-spinner" />
                  <span>Computing simulated operational shock...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

