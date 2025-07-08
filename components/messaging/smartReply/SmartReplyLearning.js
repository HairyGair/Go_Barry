import AsyncStorage from '@react-native-async-storage/async-storage';

class SmartReplyLearning {
  constructor() {
    this.STORAGE_KEY = '@GoBarry:SmartReplyPatterns';
    this.patterns = [];
    this.loadPatterns();
  }

  async loadPatterns() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.patterns = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading smart reply patterns:', error);
    }
  }

  async savePatterns() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.patterns));
    } catch (error) {
      console.error('Error saving smart reply patterns:', error);
    }
  }

  // Record when a supervisor uses a suggestion
  async recordUsage(alertContext, suggestion, modifications = null) {
    const pattern = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      alertType: alertContext.type,
      severity: alertContext.severity,
      location: alertContext.location,
      suggestionUsed: suggestion.id,
      template: modifications || suggestion.template,
      channels: suggestion.channels,
      priority: suggestion.priority,
      wasModified: !!modifications,
      supervisor: alertContext.supervisor?.badge
    };

    this.patterns.push(pattern);
    
    // Keep only last 100 patterns
    if (this.patterns.length > 100) {
      this.patterns = this.patterns.slice(-100);
    }

    await this.savePatterns();
  }

  // Get personalized suggestions based on history
  getPersonalizedSuggestions(alertContext, supervisorBadge) {
    const relevantPatterns = this.patterns.filter(p => {
      // Match by alert type and supervisor
      const typeMatch = p.alertType === alertContext.type;
      const supervisorMatch = p.supervisor === supervisorBadge;
      const severityMatch = p.severity === alertContext.severity;
      
      // Calculate relevance score
      let score = 0;
      if (typeMatch) score += 3;
      if (supervisorMatch) score += 2;
      if (severityMatch) score += 1;
      
      return score >= 3; // Minimum relevance threshold
    });

    // Sort by recency and frequency
    const suggestionFrequency = {};
    relevantPatterns.forEach(p => {
      const key = p.template;
      if (!suggestionFrequency[key]) {
        suggestionFrequency[key] = {
          template: p.template,
          channels: p.channels,
          priority: p.priority,
          count: 0,
          lastUsed: p.timestamp
        };
      }
      suggestionFrequency[key].count++;
      if (p.timestamp > suggestionFrequency[key].lastUsed) {
        suggestionFrequency[key].lastUsed = p.timestamp;
      }
    });

    // Convert to array and sort by frequency and recency
    return Object.values(suggestionFrequency)
      .sort((a, b) => {
        // Prioritize frequency, then recency
        if (b.count !== a.count) return b.count - a.count;
        return new Date(b.lastUsed) - new Date(a.lastUsed);
      })
      .slice(0, 3) // Top 3 personalized suggestions
      .map((item, idx) => ({
        id: `learned_${idx}`,
        category: 'personalized',
        icon: '🧠',
        title: 'Previously Effective',
        preview: item.template.substring(0, 60) + '...',
        template: item.template,
        channels: item.channels,
        priority: item.priority,
        usageCount: item.count
      }));
  }

  // Analyze patterns to improve suggestions
  analyzePatterns() {
    const insights = {
      mostUsedTemplates: {},
      preferredChannels: {},
      modificationRate: 0,
      peakResponseTimes: []
    };

    this.patterns.forEach(p => {
      // Track template usage
      if (!insights.mostUsedTemplates[p.alertType]) {
        insights.mostUsedTemplates[p.alertType] = {};
      }
      const key = p.suggestionUsed;
      insights.mostUsedTemplates[p.alertType][key] = 
        (insights.mostUsedTemplates[p.alertType][key] || 0) + 1;

      // Track channel preferences
      p.channels.forEach(channel => {
        insights.preferredChannels[channel] = 
          (insights.preferredChannels[channel] || 0) + 1;
      });
    });

    // Calculate modification rate
    const modifiedCount = this.patterns.filter(p => p.wasModified).length;
    insights.modificationRate = this.patterns.length > 0 
      ? (modifiedCount / this.patterns.length) * 100 
      : 0;

    return insights;
  }

  // Get contextual hints for message composition
  getContextualHints(alertContext) {
    const hints = [];
    
    // Time-based hints
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) {
      hints.push({
        type: 'timing',
        message: 'Morning rush hour - emphasize alternative routes',
        icon: '🌅'
      });
    } else if (hour >= 16 && hour <= 18) {
      hints.push({
        type: 'timing',
        message: 'Evening rush hour - include delay estimates',
        icon: '🌆'
      });
    }

    // Severity-based hints
    if (alertContext.severity === 'critical') {
      hints.push({
        type: 'severity',
        message: 'Critical alert - use urgent language and multiple channels',
        icon: '🚨'
      });
    }

    // Location-based hints
    if (alertContext.location?.includes('City Centre')) {
      hints.push({
        type: 'location',
        message: 'City centre location - high passenger impact',
        icon: '🏙️'
      });
    }

    // Weather-based hints (if available)
    if (alertContext.weather?.includes('rain') || alertContext.weather?.includes('snow')) {
      hints.push({
        type: 'weather',
        message: 'Poor weather conditions - remind drivers of safety',
        icon: '🌧️'
      });
    }

    return hints;
  }
}

// Export singleton instance
export default new SmartReplyLearning();