// Report Generation Service
// Creates business period reports and analytics

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class ReportGenerator {
  constructor() {
    this.reportCache = new Map();
  }

  // Generate Period Summary Report
  async generatePeriodReport(periodNumber, year) {
    const cacheKey = `period-${year}-${periodNumber}`;
    
    // Check cache first
    if (this.reportCache.has(cacheKey)) {
      const cached = this.reportCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data;
      }
    }

    try {
      // Get all disruptions for the period
      const { data: disruptions, error } = await supabase
        .from('historical_disruptions')
        .select('*')
        .eq('business_period', periodNumber)
        .eq('business_year', year);

      if (error) throw error;

      // Calculate statistics
      const stats = this.calculatePeriodStatistics(disruptions);
      
      // Get route impact data
      const routeImpacts = await this.calculateRouteImpacts(disruptions);
      
      // Get time patterns
      const patterns = this.analyzeTimePatterns(disruptions);

      const report = {
        period: periodNumber,
        year: year,
        generated_at: new Date(),
        summary: {
          total_disruptions: disruptions.length,
          by_type: stats.byType,
          avg_duration_minutes: stats.avgDuration,
          total_disruption_minutes: stats.totalMinutes,
          critical_incidents: stats.criticalCount
        },
        route_analysis: {
          most_affected: routeImpacts[0],
          top_5_routes: routeImpacts.slice(0, 5),
          total_routes_affected: stats.uniqueRoutes
        },
        time_patterns: patterns,
        disruptions: disruptions.map(d => ({
          id: d.disruption_id,
          type: d.type,
          title: d.title,
          severity: d.severity,
          duration: d.duration_minutes,
          routes: d.affected_routes,
          date: d.start_time
        }))
      };

      // Cache the report
      this.reportCache.set(cacheKey, {
        data: report,
        timestamp: Date.now()
      });

      return report;
    } catch (error) {
      console.error('❌ Error generating period report:', error);
      throw error;
    }
  }

  // Calculate period statistics
  calculatePeriodStatistics(disruptions) {
    const stats = {
      byType: {
        incident: 0,
        roadwork: 0,
        event: 0
      },
      totalMinutes: 0,
      avgDuration: 0,
      criticalCount: 0,
      uniqueRoutes: new Set()
    };

    disruptions.forEach(d => {
      stats.byType[d.type]++;
      stats.totalMinutes += d.duration_minutes || 0;
      if (d.severity >= 8) stats.criticalCount++;
      
      if (d.affected_routes) {
        d.affected_routes.forEach(route => stats.uniqueRoutes.add(route));
      }
    });

    stats.avgDuration = disruptions.length > 0 
      ? Math.round(stats.totalMinutes / disruptions.length) 
      : 0;
    
    stats.uniqueRoutes = stats.uniqueRoutes.size;

    return stats;
  }

  // Calculate route impacts
  async calculateRouteImpacts(disruptions) {
    const routeMap = new Map();

    disruptions.forEach(d => {
      if (d.affected_routes) {
        d.affected_routes.forEach(route => {
          if (!routeMap.has(route)) {
            routeMap.set(route, {
              route: route,
              count: 0,
              totalMinutes: 0,
              maxSeverity: 0
            });
          }
          
          const routeData = routeMap.get(route);
          routeData.count++;
          routeData.totalMinutes += d.duration_minutes || 0;
          routeData.maxSeverity = Math.max(routeData.maxSeverity, d.severity || 0);
        });
      }
    });

    // Sort by impact (count * severity)
    return Array.from(routeMap.values())
      .map(r => ({
        ...r,
        avgMinutes: Math.round(r.totalMinutes / r.count),
        impact_score: r.count * r.maxSeverity
      }))
      .sort((a, b) => b.impact_score - a.impact_score);
  }

  // Analyze time patterns
  analyzeTimePatterns(disruptions) {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    disruptions.forEach(d => {
      const date = new Date(d.start_time);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    return {
      peak_hour: peakHour,
      peak_hour_count: hourCounts[peakHour],
      peak_day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][peakDay],
      peak_day_count: dayCounts[peakDay],
      hourly_distribution: hourCounts,
      daily_distribution: dayCounts
    };
  }

  // Generate comparison report (period vs period)
  async generateComparisonReport(period1, year1, period2, year2) {
    const [report1, report2] = await Promise.all([
      this.generatePeriodReport(period1, year1),
      this.generatePeriodReport(period2, year2)
    ]);

    return {
      period_1: report1.summary,
      period_2: report2.summary,
      comparison: {
        disruption_change: report2.summary.total_disruptions - report1.summary.total_disruptions,
        disruption_change_pct: this.calculatePercentageChange(
          report1.summary.total_disruptions,
          report2.summary.total_disruptions
        ),
        duration_change: report2.summary.avg_duration_minutes - report1.summary.avg_duration_minutes,
        critical_change: report2.summary.critical_incidents - report1.summary.critical_incidents
      }
    };
  }

  // Generate route-specific report
  async generateRouteReport(routeNumber, periodNumber, year) {
    const { data: disruptions, error } = await supabase
      .from('historical_disruptions')
      .select('*')
      .contains('affected_routes', [routeNumber])
      .eq('business_period', periodNumber)
      .eq('business_year', year)
      .order('start_time', { ascending: false });

    if (error) throw error;

    return {
      route: routeNumber,
      period: periodNumber,
      year: year,
      total_disruptions: disruptions.length,
      total_minutes: disruptions.reduce((sum, d) => sum + (d.duration_minutes || 0), 0),
      avg_duration: disruptions.length > 0 
        ? Math.round(disruptions.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / disruptions.length)
        : 0,
      disruptions: disruptions
    };
  }

  // Generate "Major Disruptions" report for directors
  async generateMajorDisruptionsReport(periodNumber, year, severityThreshold = 7) {
    const { data: disruptions, error } = await supabase
      .from('historical_disruptions')
      .select('*')
      .eq('business_period', periodNumber)
      .eq('business_year', year)
      .gte('severity', severityThreshold)
      .order('severity', { ascending: false });

    if (error) throw error;

    return {
      period: periodNumber,
      year: year,
      severity_threshold: severityThreshold,
      total_major_disruptions: disruptions.length,
      disruptions: disruptions.map(d => ({
        id: d.disruption_id,
        type: d.type,
        title: d.title,
        severity: d.severity,
        duration_hours: Math.round((d.duration_minutes || 0) / 60),
        affected_routes: d.affected_routes,
        date: new Date(d.start_time).toLocaleDateString('en-GB'),
        handled_by: d.handled_by
      }))
    };
  }

  // Utility function
  calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }
}

// Create singleton instance
const reportGenerator = new ReportGenerator();

export default reportGenerator;
