// hooks/useTrafficFlow.js
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useTrafficFlow(alertId) {
  const flowData = useQuery(api.flowMonitoring.getFlowData, 
    alertId ? { alertId } : "skip"
  );
  
  return {
    flowData,
    isLoading: flowData === undefined,
    hasFlow: flowData !== null
  };
}

export function useActiveFlows() {
  const activeFlows = useQuery(api.flowMonitoring.getActiveFlowMonitoring);
  
  return {
    activeFlows: activeFlows?.flows || [],
    count: activeFlows?.count || 0,
    isLoading: activeFlows === undefined
  };
}

export function useCriticalFlows() {
  const criticalFlows = useQuery(api.flowMonitoring.getCriticalFlows);
  
  return {
    criticalFlows: criticalFlows?.critical || [],
    highFlows: criticalFlows?.high || [],
    totalCritical: criticalFlows?.total || 0,
    isLoading: criticalFlows === undefined
  };
}