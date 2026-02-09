import React, { useState } from 'react';

const ExportPanel = ({ onExport, period }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedSections, setSelectedSections] = useState({
    kpis: true,
    trends: true,
    depotComparison: true,
    fleetHealth: true
  });

  const formats = [
    {
      value: 'pdf',
      label: 'PDF Report',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      )
    },
    {
      value: 'csv',
      label: 'CSV Data',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      )
    }
  ];

  const sections = [
    { key: 'kpis', label: 'Executive KPIs' },
    { key: 'trends', label: 'Performance Trends' },
    { key: 'depotComparison', label: 'Depot Comparison' },
    { key: 'fleetHealth', label: 'Fleet Health' }
  ];

  const handleSectionToggle = (section) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExport = () => {
    const activeSections = Object.entries(selectedSections)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);

    if (activeSections.length === 0) {
      alert('Please select at least one section to export');
      return;
    }

    onExport(selectedFormat, activeSections);
  };

  const selectedCount = Object.values(selectedSections).filter(v => v).length;

  const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  return (
    <div className="ep-export-panel">
      <div className="ep-panel-header">
        <h3>Export Dashboard</h3>
        <p className="ep-subtitle">Generate reports for {getPeriodLabel(period)}</p>
      </div>

      <div className="ep-export-content">
        {/* Format Selection */}
        <div className="ep-format-section">
          <h4>Select Format</h4>
          <div className="ep-format-options">
            {formats.map(format => (
              <label key={format.value} className="ep-format-option">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <div className="ep-format-label">
                  <span className="ep-format-icon">{format.icon}</span>
                  <span>{format.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section Selection */}
        <div className="ep-section-selection">
          <h4>Include Sections</h4>
          <div className="ep-section-options">
            {sections.map(section => (
              <label key={section.key} className="ep-section-option">
                <input
                  type="checkbox"
                  checked={selectedSections[section.key]}
                  onChange={() => handleSectionToggle(section.key)}
                />
                <span>{section.label}</span>
              </label>
            ))}
          </div>
          <p className="ep-section-count">
            {selectedCount} of {sections.length} sections selected
          </p>
        </div>
      </div>

      <div className="ep-export-actions">
        <button
          className="ep-export-btn"
          onClick={handleExport}
          disabled={selectedCount === 0}
        >
          <span className="ep-btn-icon"><DownloadIcon /></span>
          Export {selectedFormat.toUpperCase()}
        </button>

        <div className="ep-export-tips">
          <p><span className="ep-tip-label">Tip:</span> Exports include data for the selected time period</p>
        </div>
      </div>

      <style jsx>{`
        .ep-export-panel {
          background: #141D2B;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          margin-top: 20px;
          font-family: 'Inter', sans-serif;
        }

        .ep-panel-header {
          margin-bottom: 20px;
        }

        h3 {
          color: #0097A7;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          font-family: 'Outfit', sans-serif;
        }

        .ep-subtitle {
          color: #94A3B8;
          font-size: 14px;
        }

        .ep-export-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        h4 {
          font-size: 16px;
          color: #FFFFFF;
          margin-bottom: 15px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
        }

        .ep-format-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ep-format-option {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 2px solid #1E293B;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ep-format-option:hover {
          border-color: #0097A7;
          background: rgba(0, 151, 167, 0.1);
        }

        .ep-format-option input[type="radio"] {
          margin-right: 12px;
          cursor: pointer;
          accent-color: #0097A7;
        }

        .ep-format-option input[type="radio"]:checked + .ep-format-label {
          font-weight: 600;
          color: #0097A7;
        }

        .ep-format-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FFFFFF;
        }

        .ep-format-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ep-section-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ep-section-option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #1E293B;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #FFFFFF;
        }

        .ep-section-option:hover {
          background: #1E293B;
        }

        .ep-section-option input[type="checkbox"] {
          margin-right: 10px;
          cursor: pointer;
          accent-color: #0097A7;
        }

        .ep-section-count {
          margin-top: 10px;
          font-size: 13px;
          color: #94A3B8;
          font-style: italic;
        }

        .ep-export-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid #1E293B;
        }

        .ep-export-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #0097A7, #00838F);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
        }

        .ep-export-btn:hover {
          box-shadow: 0 0 20px rgba(0, 151, 167, 0.4);
          transform: translateY(-1px);
        }

        .ep-export-btn:disabled {
          background: #1E293B;
          color: #64748B;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .ep-btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ep-export-tips {
          text-align: right;
        }

        .ep-export-tips p {
          font-size: 13px;
          color: #94A3B8;
        }

        .ep-tip-label {
          color: #0097A7;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .ep-export-content {
            grid-template-columns: 1fr;
          }

          .ep-export-actions {
            flex-direction: column;
            gap: 15px;
          }

          .ep-export-tips {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );

  function getPeriodLabel(period) {
    switch(period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'Selected Period';
    }
  }
};

export default ExportPanel;
