import { createClient } from '@supabase/supabase-js';
import { enhancedGTFSMatcher } from './enhancedGTFSMatcher.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class ActionSuggestionsService {
  constructor() {
    this.routeMatcher = enhancedGTFSMatcher;
  }

  /**
   * Get AI-powered action suggestions for an incident
   */
  async getSuggestions(incident) {
    try {
      const suggestions = {
        messages: [],
        diversions: [],
        similarIncidents: [],
        affectedRoutes: [],
        recommendedActions: []
      };

      // 1. Find affected routes
      if (incident.location || incident.description) {
        const routeMatches = await this.routeMatcher.findRoutesNearLocation(
          incident.location || incident.description
        );
        suggestions.affectedRoutes = routeMatches.slice(0, 5);
      }

      // 2. Find similar historical incidents
      const similarIncidents = await this.findSimilarIncidents(incident);
      suggestions.similarIncidents = similarIncidents;

      // 3. Get relevant message templates
      const messageTemplates = await this.getRelevantMessageTemplates(incident, suggestions.affectedRoutes);
      suggestions.messages = messageTemplates;

      // 4. Get diversion templates for affected routes
      if (suggestions.affectedRoutes.length > 0) {
        const diversionTemplates = await this.getDiversionTemplates(
          suggestions.affectedRoutes.map(r => r.route_id)
        );
        suggestions.diversions = diversionTemplates;
      }

      // 5. Generate recommended actions based on patterns
      suggestions.recommendedActions = await this.generateRecommendedActions(
        incident,
        similarIncidents,
        suggestions.affectedRoutes
      );

      return {
        success: true,
        suggestions,
        confidence: this.calculateConfidence(suggestions)
      };
    } catch (error) {
      console.error('❌ Action suggestions error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: this.getDefaultSuggestions()
      };
    }
  }

  /**
   * Find similar incidents from history
   */
  async findSimilarIncidents(incident) {
    try {
      // Build search query
      let query = supabase
        .from('historical_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Search by location similarity
      if (incident.location) {
        const keywords = this.extractKeywords(incident.location);
        if (keywords.length > 0) {
          query = query.or(keywords.map(k => `location.ilike.%${k}%`).join(','));
        }
      }

      // Search by severity
      if (incident.severity) {
        query = query.eq('severity', incident.severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Score and rank results
      const scored = data.map(historical => ({
        ...historical,
        similarity_score: this.calculateSimilarity(incident, historical),
        resolution_time: this.calculateResolutionTime(historical),
        effectiveness_score: historical.effectiveness_score || 0.7
      }));

      // Return top 5 most similar
      return scored
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          location: item.location,
          severity: item.severity,
          description: item.description,
          resolution: item.resolution_notes,
          resolution_time: item.resolution_time,
          actions_taken: item.actions_taken || [],
          similarity: Math.round(item.similarity_score * 100) + '%',
          effectiveness: Math.round(item.effectiveness_score * 100) + '%'
        }));
    } catch (error) {
      console.error('❌ Similar incidents search error:', error);
      return [];
    }
  }

  /**
   * Get relevant message templates
   */
  async getRelevantMessageTemplates(incident, affectedRoutes) {
    try {
      // Get templates based on incident type
      const { data: templates, error } = await supabase
        .from('message_templates')
        .select(`
          *,
          template_categories (
            name,
            priority
          )
        `)
        .in('category_id', await this.getRelevantCategories(incident))
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Score templates by relevance
      const scored = templates.map(template => ({
        ...template,
        relevance_score: this.calculateTemplateRelevance(template, incident, affectedRoutes)
      }));

      // Return top 5 most relevant
      return scored
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 5)
        .map(template => ({
          id: template.id,
          title: template.title,
          content: this.personalizeTemplate(template.content, incident, affectedRoutes),
          category: template.template_categories?.name,
          usage_count: template.usage_count,
          relevance: Math.round(template.relevance_score * 100) + '%'
        }));
    } catch (error) {
      console.error('❌ Message template error:', error);
      return [];
    }
  }

  /**
   * Get diversion templates for affected routes
   */
  async getDiversionTemplates(routeIds) {
    try {
      const { data: diversions, error } = await supabase
        .from('diversion_templates')
        .select('*')
        .in('route_id', routeIds)
        .eq('is_active', true)
        .order('effectiveness_rating', { ascending: false });

      if (error) throw error;

      return diversions.slice(0, 3).map(div => ({
        id: div.id,
        route_id: div.route_id,
        title: div.title,
        description: div.description,
        diversion_route: div.diversion_route,
        estimated_delay: div.estimated_delay_minutes,
        effectiveness: div.effectiveness_rating
      }));
    } catch (error) {
      console.error('❌ Diversion template error:', error);
      return [];
    }
  }

  /**
   * Generate recommended actions based on patterns
   */
  async generateRecommendedActions(incident, similarIncidents, affectedRoutes) {
    const actions = [];

    // 1. Immediate actions based on severity
    if (incident.severity === 'critical' || incident.severity === 'high') {
      actions.push({
        type: 'immediate',
        action: 'Issue driver alert',
        reason: 'High severity incident affecting multiple routes',
        priority: 1
      });
    }

    // 2. Based on similar incidents
    if (similarIncidents.length > 0) {
      const commonActions = this.extractCommonActions(similarIncidents);
      commonActions.forEach(action => {
        actions.push({
          type: 'historical',
          action: action.action,
          reason: `Successful in ${action.success_rate}% of similar incidents`,
          priority: 2
        });
      });
    }

    // 3. Route-specific actions
    if (affectedRoutes.length > 0) {
      actions.push({
        type: 'route',
        action: `Notify drivers on routes: ${affectedRoutes.slice(0, 3).map(r => r.route_short_name).join(', ')}`,
        reason: 'Routes directly impacted by incident location',
        priority: 1
      });

      if (affectedRoutes.some(r => r.route_type === 'express')) {
        actions.push({
          type: 'route',
          action: 'Consider express service suspension',
          reason: 'Express services cannot easily divert',
          priority: 2
        });
      }
    }

    // 4. Time-based actions
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9 || hour >= 16 && hour <= 18) {
      actions.push({
        type: 'timing',
        action: 'Issue public social media update',
        reason: 'Peak travel time - maximum passenger impact',
        priority: 1
      });
    }

    // Sort by priority and return top 5
    return actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);
  }

  /**
   * Helper: Extract keywords from text
   */
  extractKeywords(text) {
    const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.includes(word))
      .slice(0, 5);
  }

  /**
   * Helper: Calculate similarity between incidents
   */
  calculateSimilarity(incident1, incident2) {
    let score = 0;
    
    // Location similarity
    if (incident1.location && incident2.location) {
      const keywords1 = this.extractKeywords(incident1.location);
      const keywords2 = this.extractKeywords(incident2.location);
      const matches = keywords1.filter(k => keywords2.includes(k));
      score += (matches.length / Math.max(keywords1.length, keywords2.length)) * 0.4;
    }

    // Severity match
    if (incident1.severity === incident2.severity) {
      score += 0.3;
    }

    // Time of day similarity (within 2 hours)
    const hour1 = new Date(incident1.created_at).getHours();
    const hour2 = new Date(incident2.created_at).getHours();
    if (Math.abs(hour1 - hour2) <= 2) {
      score += 0.2;
    }

    // Day of week match
    const day1 = new Date(incident1.created_at).getDay();
    const day2 = new Date(incident2.created_at).getDay();
    if (day1 === day2) {
      score += 0.1;
    }

    return score;
  }

  /**
   * Helper: Calculate resolution time
   */
  calculateResolutionTime(incident) {
    if (!incident.resolved_at) return null;
    const created = new Date(incident.created_at);
    const resolved = new Date(incident.resolved_at);
    const minutes = Math.round((resolved - created) / 60000);
    return `${minutes} mins`;
  }

  /**
   * Helper: Get relevant categories based on incident
   */
  async getRelevantCategories(incident) {
    // Map incident characteristics to template categories
    const categories = [];
    
    if (incident.severity === 'critical') {
      categories.push(1); // Emergency category
    }
    
    if (incident.type === 'roadworks') {
      categories.push(2); // Roadworks category
    }
    
    if (incident.type === 'accident') {
      categories.push(3); // Accident category
    }
    
    // Default categories
    categories.push(4, 5); // General updates, Driver alerts
    
    return categories;
  }

  /**
   * Helper: Calculate template relevance
   */
  calculateTemplateRelevance(template, incident, affectedRoutes) {
    let score = 0.5; // Base score

    // Category priority
    if (template.template_categories?.priority === 'high') {
      score += 0.2;
    }

    // Usage frequency
    score += Math.min(template.usage_count / 1000, 0.2);

    // Route-specific templates
    if (template.route_specific && affectedRoutes.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Helper: Personalize template content
   */
  personalizeTemplate(content, incident, affectedRoutes) {
    let personalized = content;

    // Replace placeholders
    personalized = personalized.replace('[LOCATION]', incident.location || 'the affected area');
    personalized = personalized.replace('[SEVERITY]', incident.severity || 'moderate');
    personalized = personalized.replace('[TIME]', new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    
    if (affectedRoutes.length > 0) {
      const routeList = affectedRoutes.slice(0, 3).map(r => r.route_short_name).join(', ');
      personalized = personalized.replace('[ROUTES]', routeList);
    }

    return personalized;
  }

  /**
   * Helper: Extract common actions from similar incidents
   */
  extractCommonActions(similarIncidents) {
    const actionCounts = {};
    
    similarIncidents.forEach(incident => {
      if (incident.actions_taken) {
        incident.actions_taken.forEach(action => {
          actionCounts[action] = (actionCounts[action] || 0) + 1;
        });
      }
    });

    return Object.entries(actionCounts)
      .map(([action, count]) => ({
        action,
        success_rate: Math.round((count / similarIncidents.length) * 100)
      }))
      .filter(a => a.success_rate >= 60)
      .sort((a, b) => b.success_rate - a.success_rate);
  }

  /**
   * Helper: Calculate overall confidence
   */
  calculateConfidence(suggestions) {
    let confidence = 0;
    
    if (suggestions.similarIncidents.length > 0) confidence += 0.3;
    if (suggestions.affectedRoutes.length > 0) confidence += 0.3;
    if (suggestions.messages.length > 0) confidence += 0.2;
    if (suggestions.recommendedActions.length > 0) confidence += 0.2;
    
    return Math.round(confidence * 100) + '%';
  }

  /**
   * Helper: Get default suggestions
   */
  getDefaultSuggestions() {
    return {
      messages: [{
        title: 'General Service Update',
        content: 'We are aware of an incident affecting services. Updates to follow.',
        category: 'General',
        relevance: '50%'
      }],
      diversions: [],
      similarIncidents: [],
      affectedRoutes: [],
      recommendedActions: [{
        type: 'default',
        action: 'Monitor situation and update as needed',
        reason: 'Standard procedure for unclassified incidents',
        priority: 3
      }]
    };
  }
}

// Export singleton instance
export const actionSuggestions = new ActionSuggestionsService();