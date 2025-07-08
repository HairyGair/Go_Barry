import { useState, useCallback, useEffect } from 'react';
import SmartReplyLearning from '../smartReply/SmartReplyLearning';
import { useSupervisorSession } from '../../hooks/useSupervisorSession';

export const useSmartReply = (alert, context = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState([]);
  const [contextualHints, setContextualHints] = useState([]);
  const { currentSupervisor } = useSupervisorSession();

  // Load personalized suggestions based on supervisor history
  useEffect(() => {
    if (alert && currentSupervisor) {
      const personalized = SmartReplyLearning.getPersonalizedSuggestions(
        { ...alert, ...context },
        currentSupervisor.badge
      );
      setPersonalizedSuggestions(personalized);

      const hints = SmartReplyLearning.getContextualHints({ ...alert, ...context });
      setContextualHints(hints);
    }
  }, [alert, context, currentSupervisor]);

  // Record when a suggestion is used
  const recordSuggestionUsage = useCallback(async (suggestion, finalMessage = null) => {
    if (!alert || !currentSupervisor) return;

    await SmartReplyLearning.recordUsage(
      { ...alert, ...context, supervisor: currentSupervisor },
      suggestion,
      finalMessage
    );
  }, [alert, context, currentSupervisor]);

  // Generate base suggestions (called by SmartReplyEngine)
  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // In production, this could call an AI service
      // For now, returns context-aware templates
      const baseSuggestions = await generateBaseSuggestions(alert, context);
      
      // Merge with personalized suggestions
      const allSuggestions = [
        ...personalizedSuggestions,
        ...baseSuggestions
      ];

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [alert, context, personalizedSuggestions]);

  // Get analytics about smart reply usage
  const getUsageAnalytics = useCallback(() => {
    return SmartReplyLearning.analyzePatterns();
  }, []);

  return {
    suggestions,
    personalizedSuggestions,
    contextualHints,
    isLoading,
    generateSuggestions,
    recordSuggestionUsage,
    getUsageAnalytics
  };
};

// Helper function to generate base suggestions
async function generateBaseSuggestions(alert, context) {
  const suggestions = [];
  const type = alert?.type || 'general';
  const severity = alert?.severity || 'medium';
  const location = alert?.location || 'unspecified location';
  const routes = alert?.affected_routes || [];

  // Template library based on alert type
  const templates = {
    roadwork: [
      {
        condition: severity === 'critical',
        suggestion: {
          title: 'Emergency Roadwork Alert',
          template: `🚨 URGENT: Emergency roadworks at ${location}. Routes ${routes.join(', ')} suspended. Use alternative transport.`,
          priority: 'critical',
          channels: ['all', 'emergency']
        }
      },
      {
        condition: routes.length > 3,
        suggestion: {
          title: 'Multiple Routes Affected',
          template: `⚠️ Major roadworks affecting ${routes.length} routes at ${location}. See control room for diversion details.`,
          priority: 'high',
          channels: ['drivers', 'control']
        }
      }
    ],
    accident: [
      {
        condition: true,
        suggestion: {
          title: 'Accident Response',
          template: `🚨 RTC at ${location}. Emergency services on scene. Routes ${routes.join(', ')} diverted. Avoid area.`,
          priority: 'critical',
          channels: ['all']
        }
      }
    ],
    congestion: [
      {
        condition: severity === 'high',
        suggestion: {
          title: 'Severe Delays Warning',
          template: `⚠️ Heavy congestion at ${location}. ${routes.join(', ')} experiencing 15+ min delays. Consider alternatives.`,
          priority: 'high',
          channels: ['drivers', 'customer_service']
        }
      }
    ],
    event: [
      {
        condition: true,
        suggestion: {
          title: 'Event Traffic Alert',
          template: `📍 Event traffic expected at ${location}. Routes ${routes.join(', ')} may experience delays. Plan ahead.`,
          priority: 'medium',
          channels: ['drivers', 'control']
        }
      }
    ]
  };

  // Get relevant templates for alert type
  const typeTemplates = templates[type] || templates.congestion;
  
  typeTemplates.forEach((item, idx) => {
    if (item.condition) {
      suggestions.push({
        id: `base_${type}_${idx}`,
        category: 'suggested',
        icon: '💡',
        ...item.suggestion,
        preview: item.suggestion.template.substring(0, 60) + '...'
      });
    }
  });

  // Add generic templates
  suggestions.push({
    id: 'generic_update',
    category: 'update',
    icon: '📢',
    title: 'Service Update',
    template: `SERVICE UPDATE: ${type} at ${location}. Routes ${routes.join(', ')} affected. Updates to follow.`,
    preview: 'General service update template',
    priority: 'medium',
    channels: ['drivers']
  });

  suggestions.push({
    id: 'generic_clear',
    category: 'status',
    icon: '✅',
    title: 'All Clear',
    template: `✅ ${location} - ${type} now cleared. Normal service resuming on routes ${routes.join(', ')}.`,
    preview: 'Situation resolved template',
    priority: 'low',
    channels: ['drivers', 'control']
  });

  return suggestions;
}