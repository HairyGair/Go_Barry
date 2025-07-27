// Simplified useConvexSync hook without dynamic imports
// This version works with Metro bundler

export default function useConvexSync() {
  // Return a mock implementation that satisfies the DisruptionDatabase requirements
  return {
    activeIncidents: [],
    allIncidents: [],
    // Add any other properties that DisruptionDatabase needs
  };
}

// Export additional hooks if needed
export function useSupervisorActions(options = {}) {
  return [];
}

export function useLoginTracking() {
  return {
    recentLogins: [],
    loginHistory: [],
    trackLogin: () => {},
  };
}

export function useHeartbeat(sessionId, interval = 30000) {
  // No-op for now
}
