/*
 * Depot KPI Dashboard Component
 * Shows breakdown response time league table and performance metrics
 * Part of Go BARRY Breakdown Guide Enhancement
 */

class DepotKPIDashboard {
  constructor() {
    this.data = null;
    this.refreshInterval = null;
    this.apiBase = window.CONFIG?.API_BASE || 'https://api.breakdowns.gobarry.co.uk';
  }

  // Initialize the dashboard
  async init() {
    await this.loadData();
    this.renderDashboard();
    this.startAutoRefresh();
  }

  // Load KPI data from API
  async loadData() {
    try {
      const response = await fetch(`${this.apiBase}/api/breakdown-tracker/kpi/depot-summary`);
      const result = await response.json();
      
      if (result.success) {
        this.data = result.depots;
        this.lastUpdated = result.generated_at;
      }
    } catch (error) {
      console.error('Error loading depot KPIs:', error);
    }
  }

  // Render the dashboard
  renderDashboard() {
    const container = document.getElementById('depot-kpi-dashboard');
    if (!container || !this.data) return;

    container.innerHTML = `
      <div class="depot-kpi-dashboard">
        <div class="dashboard-header">
          <h2>🏆 Depot Performance League Table</h2>
          <div class="last-updated">
            Last updated: ${this.formatTimestamp(this.lastUpdated)}
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card total">
            <div class="card-icon">🚍</div>
            <div class="card-content">
              <div class="card-value">${this.getTotalBreakdowns()}</div>
              <div class="card-label">Total Breakdowns (30 days)</div>
            </div>
          </div>
          <div class="summary-card best">
            <div class="card-icon">🥇</div>
            <div class="card-content">
              <div class="card-value">${this.getBestDepot()?.depot_id || 'N/A'}</div>
              <div class="card-label">Best Performing Depot</div>
            </div>
          </div>
          <div class="summary-card fastest">
            <div class="card-icon">⚡</div>
            <div class="card-content">
              <div class="card-value">${this.getFastestResponse()}m</div>
              <div class="card-label">Network Fastest Response</div>
            </div>
          </div>
          <div class="summary-card compliance">
            <div class="card-icon">✅</div>
            <div class="card-content">
              <div class="card-value">${this.getAverageCompliance()}%</div>
              <div class="card-label">Average SLA Compliance</div>
            </div>
          </div>
        </div>

        <!-- League Table -->
        <div class="league-table">
          <h3>📊 Depot Rankings</h3>
          <div class="table-container">
            <table class="kpi-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Depot</th>
                  <th>Grade</th>
                  <th>Total</th>
                  <th>Receipt→Ack</th>
                  <th>Ack→Decision</th>
                  <th>Dispatch→Site</th>
                  <th>Receipt→Clear</th>
                  <th>Overall Score</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.map(depot => this.renderDepotRow(depot)).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- SLA Compliance Chart -->
        <div class="sla-compliance">
          <h3>🎯 SLA Compliance by Stage</h3>
          <div class="compliance-grid">
            ${this.renderComplianceCharts()}
          </div>
        </div>

        <!-- Detailed Metrics -->
        <div class="detailed-metrics">
          <h3>📈 Detailed Performance Metrics</h3>
          <div class="metrics-grid">
            ${this.data.map(depot => this.renderDetailedDepotCard(depot)).join('')}
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  // Render depot row in league table
  renderDepotRow(depot) {
    const gradeClass = this.getGradeClass(depot.performance_grade);
    const rankClass = this.getRankClass(depot.rank);

    return `
      <tr class="depot-row ${rankClass}">
        <td class="rank">
          <span class="rank-badge ${rankClass}">${depot.rank}</span>
        </td>
        <td class="depot-name">
          <div class="depot-info">
            <span class="depot-title">${depot.depot_id}</span>
          </div>
        </td>
        <td class="grade">
          <span class="grade-badge ${gradeClass}">${depot.performance_grade}</span>
        </td>
        <td class="total">${depot.total_breakdowns}</td>
        <td class="metric">
          <div class="metric-value">${depot.receipt_ack_median}m</div>
          <div class="metric-sla ${this.getSLAClass(depot.receipt_ack_sla_pct)}">${depot.receipt_ack_sla_pct}%</div>
        </td>
        <td class="metric">
          <div class="metric-value">${depot.ack_decision_median}m</div>
          <div class="metric-sla ${this.getSLAClass(depot.ack_decision_sla_pct)}">${depot.ack_decision_sla_pct}%</div>
        </td>
        <td class="metric">
          <div class="metric-value">${depot.dispatch_onsite_median || 'N/A'}m</div>
          <div class="metric-sla ${this.getSLAClass(depot.dispatch_onsite_sla_pct)}">${depot.dispatch_onsite_sla_pct || 'N/A'}%</div>
        </td>
        <td class="metric">
          <div class="metric-value">${depot.receipt_clear_median}m</div>
          <div class="metric-sla ${this.getSLAClass(depot.receipt_clear_sla_pct)}">${depot.receipt_clear_sla_pct}%</div>
        </td>
        <td class="overall-score">
          <div class="score-circle ${this.getScoreClass(depot.overall_score)}">
            ${depot.overall_score}
          </div>
        </td>
      </tr>
    `;
  }

  // Render detailed depot card
  renderDetailedDepotCard(depot) {
    return `
      <div class="depot-card">
        <div class="depot-header">
          <h4>${depot.depot_id}</h4>
          <span class="depot-rank">#${depot.rank}</span>
        </div>
        <div class="depot-metrics">
          <div class="metric-row">
            <span class="metric-label">Total Breakdowns:</span>
            <span class="metric-value">${depot.total_breakdowns}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Receipt → Acknowledge:</span>
            <span class="metric-value">${depot.receipt_ack_median}m (90th: ${depot.receipt_ack_p90}m)</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Acknowledge → Decision:</span>
            <span class="metric-value">${depot.ack_decision_median}m (90th: ${depot.ack_decision_p90}m)</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Receipt → Clear:</span>
            <span class="metric-value">${depot.receipt_clear_median}m (90th: ${depot.receipt_clear_p90}m)</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Overall Score:</span>
            <span class="metric-score ${this.getScoreClass(depot.overall_score)}">${depot.overall_score}/100</span>
          </div>
        </div>
      </div>
    `;
  }

  // Render compliance charts
  renderComplianceCharts() {
    const stages = [
      { key: 'receipt_ack_sla_pct', label: 'Receipt → Acknowledge', target: '≤ 2min' },
      { key: 'ack_decision_sla_pct', label: 'Acknowledge → Decision', target: '≤ 5min' },
      { key: 'dispatch_onsite_sla_pct', label: 'Dispatch → On Site', target: '≤ 30min' },
      { key: 'receipt_clear_sla_pct', label: 'Receipt → Clear', target: '≤ 90min' }
    ];

    return stages.map(stage => {
      const avgCompliance = this.getAverageComplianceForStage(stage.key);
      return `
        <div class="compliance-chart">
          <div class="chart-header">
            <h4>${stage.label}</h4>
            <div class="chart-target">Target: ${stage.target}</div>
          </div>
          <div class="chart-value">
            <div class="chart-circle">
              <div class="circle-progress" style="--progress: ${avgCompliance}%">
                <span class="circle-text">${avgCompliance}%</span>
              </div>
            </div>
          </div>
          <div class="chart-depots">
            ${this.data.map(depot => `
              <div class="depot-compliance">
                <span class="depot-name">${depot.depot_id}</span>
                <span class="compliance-value ${this.getSLAClass(depot[stage.key])}">${depot[stage.key] || 'N/A'}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // Helper methods
  getTotalBreakdowns() {
    return this.data?.reduce((sum, depot) => sum + depot.total_breakdowns, 0) || 0;
  }

  getBestDepot() {
    return this.data?.[0]; // Already sorted by overall_score DESC
  }

  getFastestResponse() {
    const fastest = Math.min(...this.data.map(d => d.receipt_ack_median || Infinity));
    return fastest === Infinity ? 'N/A' : fastest;
  }

  getAverageCompliance() {
    const avg = this.data?.reduce((sum, depot) => sum + depot.overall_score, 0) / this.data?.length;
    return Math.round(avg || 0);
  }

  getAverageComplianceForStage(stageKey) {
    const values = this.data?.map(d => d[stageKey]).filter(v => v != null) || [];
    const avg = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    return Math.round(avg);
  }

  getGradeClass(grade) {
    const classes = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' };
    return classes[grade] || 'grade-f';
  }

  getRankClass(rank) {
    if (rank === 1) return 'rank-first';
    if (rank === 2) return 'rank-second';
    if (rank === 3) return 'rank-third';
    return 'rank-other';
  }

  getSLAClass(percentage) {
    if (percentage >= 90) return 'sla-excellent';
    if (percentage >= 80) return 'sla-good';
    if (percentage >= 70) return 'sla-fair';
    return 'sla-poor';
  }

  getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    return 'score-poor';
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }

  // Auto refresh every 5 minutes
  startAutoRefresh() {
    this.refreshInterval = setInterval(async () => {
      await this.loadData();
      this.renderDashboard();
    }, 5 * 60 * 1000);
  }

  // Add styles
  addStyles() {
    if (document.getElementById('depot-kpi-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'depot-kpi-dashboard-styles';
    style.textContent = `
      .depot-kpi-dashboard {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e0e0e0;
      }

      .dashboard-header h2 {
        margin: 0;
        font-size: 28px;
        color: #1a1a1a;
      }

      .last-updated {
        color: #666;
        font-size: 14px;
      }

      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .summary-card {
        display: flex;
        align-items: center;
        gap: 15px;
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-left: 4px solid #007AFF;
      }

      .summary-card.total { border-left-color: #34C759; }
      .summary-card.best { border-left-color: #FFD60A; }
      .summary-card.fastest { border-left-color: #FF6B35; }
      .summary-card.compliance { border-left-color: #007AFF; }

      .card-icon {
        font-size: 24px;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 10px;
      }

      .card-value {
        font-size: 24px;
        font-weight: bold;
        color: #1a1a1a;
      }

      .card-label {
        font-size: 14px;
        color: #666;
      }

      .league-table, .sla-compliance, .detailed-metrics {
        background: white;
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .league-table h3, .sla-compliance h3, .detailed-metrics h3 {
        margin: 0 0 20px 0;
        font-size: 20px;
        color: #1a1a1a;
      }

      .table-container {
        overflow-x: auto;
      }

      .kpi-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .kpi-table th {
        background: #f8f9fa;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
        white-space: nowrap;
      }

      .kpi-table td {
        padding: 15px 8px;
        border-bottom: 1px solid #e9ecef;
      }

      .depot-row.rank-first { background: linear-gradient(90deg, #FFD700, transparent); }
      .depot-row.rank-second { background: linear-gradient(90deg, #C0C0C0, transparent); }
      .depot-row.rank-third { background: linear-gradient(90deg, #CD7F32, transparent); }

      .rank-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        font-weight: bold;
        color: white;
      }

      .rank-badge.rank-first { background: #FFD700; color: #1a1a1a; }
      .rank-badge.rank-second { background: #C0C0C0; color: #1a1a1a; }
      .rank-badge.rank-third { background: #CD7F32; }
      .rank-badge.rank-other { background: #6c757d; }

      .depot-name {
        font-weight: 600;
        color: #1a1a1a;
      }

      .grade-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 12px;
      }

      .grade-a { background: #d4edda; color: #155724; }
      .grade-b { background: #cce5ff; color: #004085; }
      .grade-c { background: #fff3cd; color: #856404; }
      .grade-d { background: #f8d7da; color: #721c24; }
      .grade-f { background: #343a40; color: white; }

      .metric-value {
        font-weight: 600;
        color: #1a1a1a;
      }

      .metric-sla {
        font-size: 12px;
        font-weight: 500;
      }

      .sla-excellent { color: #28a745; }
      .sla-good { color: #17a2b8; }
      .sla-fair { color: #ffc107; }
      .sla-poor { color: #dc3545; }

      .score-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-weight: bold;
        color: white;
      }

      .score-excellent { background: #28a745; }
      .score-good { background: #17a2b8; }
      .score-fair { background: #ffc107; color: #1a1a1a; }
      .score-poor { background: #dc3545; }

      .compliance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
      }

      .compliance-chart {
        text-align: center;
      }

      .chart-header h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: #1a1a1a;
      }

      .chart-target {
        font-size: 12px;
        color: #666;
        margin-bottom: 15px;
      }

      .chart-circle {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 0 auto 20px;
      }

      .circle-progress {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: conic-gradient(#007AFF calc(var(--progress) * 3.6deg), #e9ecef 0deg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .circle-progress::before {
        content: '';
        position: absolute;
        width: 80%;
        height: 80%;
        background: white;
        border-radius: 50%;
      }

      .circle-text {
        position: relative;
        z-index: 1;
        font-weight: bold;
        font-size: 18px;
        color: #1a1a1a;
      }

      .depot-compliance {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 14px;
      }

      .depot-compliance:last-child {
        border-bottom: none;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
      }

      .depot-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        border-left: 4px solid #007AFF;
      }

      .depot-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .depot-header h4 {
        margin: 0;
        font-size: 18px;
        color: #1a1a1a;
      }

      .depot-rank {
        background: #007AFF;
        color: white;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e9ecef;
        font-size: 14px;
      }

      .metric-row:last-child {
        border-bottom: none;
        font-weight: 600;
      }

      .metric-label {
        color: #495057;
      }

      .metric-score {
        font-weight: bold;
      }

      @media (max-width: 768px) {
        .depot-kpi-dashboard {
          padding: 15px;
        }
        
        .dashboard-header {
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }
        
        .summary-cards {
          grid-template-columns: 1fr;
        }
        
        .compliance-grid {
          grid-template-columns: 1fr;
        }
        
        .metrics-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Create global instance
window.DepotKPIDashboard = DepotKPIDashboard;