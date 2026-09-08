import React, { useState } from 'react';
import { Download, FileText, Code, CheckCircle, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function NsoExportView({ routes = [], indexSeries = [], overviewData = {} }) {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const handleExportCSV = () => {
    // Generate CSV data from routes and index records
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Calculation_Date,Frequency,Formula,Advance_Window,APIx_Value,Base_Period,DoD_Change_Pct,MoM_Change_Pct,Average_Fare_INR\n";
    indexSeries.forEach(row => {
      csvContent += `${row.calculation_date},DAILY,LASPEYRES,ALL_WEIGHTED,${row.index_value},2024-Q1,${row.change_pct_d1},${row.change_pct_m1},${row.average_fare}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MoSPI_APIx_Index_Series_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      metadata: {
        ministry: "Ministry of Statistics and Programme Implementation (MoSPI)",
        sub_group: "Consumer Price Index (CPI) Transport & Communication Sub-Index",
        project: "Real-time Airfare Price Index (APIx)",
        base_period: "2024-Q1",
        base_index_value: 100.0,
        exported_at: new Date().toISOString()
      },
      basket_routes: routes,
      historical_apix_series: indexSeries
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `MoSPI_APIx_Data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyEndpoint = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <div className="nso-export-view">
      <div className="section-header-row">
        <div>
          <div className="badge-pill">
            <FileText size={13} />
            <span>MACROECONOMIC DATA DISSEMINATION</span>
          </div>
          <h2 className="section-title">MoSPI / NSO / RBI CPI Integration Export</h2>
          <p className="section-subtitle">
            Export official Laspeyres airfare price index series for immediate augmentation into the national headline Consumer Price Index (CPI).
          </p>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="export-cards-grid">
        <div className="export-card">
          <div className="export-icon-wrap icon-gold">
            <FileText size={24} />
          </div>
          <h3>Official Tabular CSV Export</h3>
          <p>
            Standard tabular time-series containing daily Laspeyres APIx index values, DoD inflation rates, weighted average fares, and DGCA corridor observations.
          </p>
          <button className="btn-primary" onClick={handleExportCSV}>
            <Download size={15} /> Download CSV Dataset
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon-wrap icon-blue">
            <Code size={24} />
          </div>
          <h3>Structured JSON Feed</h3>
          <p>
            Machine-readable JSON payload formatted for direct programmatic ingestion by National Statistical Office (NSO) and Reserve Bank of India (RBI) econometric models.
          </p>
          <button className="btn-secondary" onClick={handleExportJSON}>
            <Download size={15} /> Download JSON Payload
          </button>
        </div>
      </div>

      {/* Integration API Specification */}
      <div className="api-integration-card">
        <div className="api-card-header">
          <div>
            <h4>Government Machine-to-Machine (M2M) REST Endpoints</h4>
            <p>Secure real-time feeds available for internal macroeconomic dashboards</p>
          </div>
          <button
            className="copy-endpoint-btn"
            onClick={() => handleCopyEndpoint('http://localhost:8000/api/v1/overview')}
          >
            {copiedEndpoint ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedEndpoint ? 'Copied' : 'Copy Endpoint'}</span>
          </button>
        </div>

        <div className="endpoint-list">
          <div className="endpoint-row">
            <span className="http-method get">GET</span>
            <span className="endpoint-path font-mono">/api/v1/overview</span>
            <span className="endpoint-desc">Executive summary, headline APIx index, DoD/MoM inflation</span>
          </div>
          <div className="endpoint-row">
            <span className="http-method get">GET</span>
            <span className="endpoint-path font-mono">/api/v1/index-records?frequency=DAILY</span>
            <span className="endpoint-desc">Complete daily time-series index records</span>
          </div>
          <div className="endpoint-row">
            <span className="http-method get">GET</span>
            <span className="endpoint-path font-mono">/api/v1/routes</span>
            <span className="endpoint-desc">10 DGCA domestic flight corridors & normalized weights</span>
          </div>
          <div className="endpoint-row">
            <span className="http-method get">GET</span>
            <span className="endpoint-path font-mono">/api/v1/quotes/{'{id}'}/proof</span>
            <span className="endpoint-desc">Cryptographic SHA-256 government proof-of-source inspection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
