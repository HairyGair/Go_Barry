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
    { value: 'pdf', label: 'PDF Report', icon: '📄' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: '📊' },
    { value: 'csv', label: 'CSV Data', icon: '📁' }
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

  return (
    <div className="export-panel">
      <div className="panel-header">
        <h3>Export Dashboard</h3>
        <p className="subtitle">Generate reports for {getPeriodLabel(period)}</p>
      </div>

      <div className="export-content">
        {/* Format Selection */}
        <div className="format-section">
          <h4>Select Format</h4>
          <div className="format-options">
            {formats.map(format => (
              <label key={format.value} className="format-option">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <div className="format-label">
                  <span className="format-icon">{format.icon}</span>
                  <span>{format.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section Selection */}
        <div className="section-selection">
          <h4>Include Sections</h4>
          <div className="section-options">
            {sections.map(section => (
              <label key={section.key} className="section-option">
                <input
                  type="checkbox"
                  checked={selectedSections[section.key]}
                  onChange={() => handleSectionToggle(section.key)}
                />
                <span>{section.label}</span>
              </label>
            ))}
          </div>
          <p className="section-count">
            {selectedCount} of {sections.length} sections selected
          </p>
        </div>
      </div>

      <div className="export-actions">
        <button 
          className="export-btn"
          onClick={handleExport}
          disabled={selectedCount === 0}
        >
          <span className="btn-icon">💾</span>
          Export {selectedFormat.toUpperCase()}
        </button>
        
        <div className="export-tips">
          <p>📌 Tip: Exports include data for the selected time period</p>
        </div>
      </div>

      <style jsx>{`
        .export-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-top: 20px;
        }

        .panel-header {
          margin-bottom: 20px;
        }

        h3 {
          color: #1e3a8a;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #6b7280;
          font-size: 14px;
        }

        .export-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        h4 {
          font-size: 16px;
          color: #374151;
          margin-bottom: 15px;
          font-weight: 600;
        }

        .format-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .format-option {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .format-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .format-option input[type="radio"] {
          margin-right: 12px;
          cursor: pointer;
        }

        .format-option input[type="radio"]:checked + .format-label {
          font-weight: 600;
          color: #1e3a8a;
        }

        .format-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
        }

        .format-icon {
          font-size: 20px;
        }

        .section-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .section-option:hover {
          background: #f9fafb;
        }

        .section-option input[type="checkbox"] {
          margin-right: 10px;
          cursor: pointer;
        }

        .section-count {
          margin-top: 10px;
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
        }

        .export-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .export-btn {
          padding: 12px 24px;
          background: #1e3a8a;
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
        }

        .export-btn:hover {
          background: #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
        }

        .export-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-icon {
          font-size: 20px;
        }

        .export-tips {
          text-align: right;
        }

        .export-tips p {
          font-size: 13px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .export-content {
            grid-template-columns: 1fr;
          }

          .export-actions {
            flex-direction: column;
            gap: 15px;
          }

          .export-tips {
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
