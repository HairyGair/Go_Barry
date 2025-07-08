// React hook for disruption management
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useCallback } from "react";

export function useDisruptions(filter, limit) {
  // For now, return empty data until Convex functions are deployed
  const [selectedDisruptionId, setSelectedDisruptionId] = useState(null);
  
  // Mock data structure
  const mockData = {
    disruptions: [],
    stats: {
      total: 0,
      criticalCount: 0,
      activeCount: 0,
      byType: {},
      bySeverity: {},
      byStatus: {}
    },
    selectedDisruption: null,
    selectedDisruptionId,
    setSelectedDisruptionId,
    createDisruption: async () => console.log('Convex functions not deployed yet'),
    updateDisruption: async () => console.log('Convex functions not deployed yet'),
    dismissDisruption: async () => console.log('Convex functions not deployed yet'),
    addNote: async () => console.log('Convex functions not deployed yet'),
  };
  
  // Try to use the real API if available
  try {
    const disruptions = useQuery(api.disruptions?.getDisruptions, {
      types: filter?.types,
      severities: filter?.severities,
      statuses: filter?.statuses,
      routes: filter?.routes,
      supervisorBadge: filter?.supervisorDismissed ? undefined : "current",
      limit,
    });

    const stats = useQuery(api.disruptions?.getDisruptionStats);
    const createDisruption = useMutation(api.disruptions?.createDisruption);
    const updateDisruption = useMutation(api.disruptions?.updateDisruption);
    const dismissDisruptionMutation = useMutation(api.disruptions?.dismissDisruption);
    const addNoteMutation = useMutation(api.disruptions?.addDisruptionNote);

    const selectedDisruption = useQuery(
      api.disruptions?.getDisruption,
      selectedDisruptionId ? { id: selectedDisruptionId } : "skip"
    );

    const handleDismiss = useCallback(
      async (disruptionId, supervisorBadge) => {
        await dismissDisruptionMutation({ disruptionId, supervisorBadge });
      },
      [dismissDisruptionMutation]
    );

    const handleAddNote = useCallback(
      async (disruptionId, note) => {
        await addNoteMutation({
          disruptionId,
          ...note,
        });
      },
      [addNoteMutation]
    );

    return {
      disruptions: disruptions || [],
      stats: stats || mockData.stats,
      selectedDisruption,
      selectedDisruptionId,
      setSelectedDisruptionId,
      createDisruption,
      updateDisruption,
      dismissDisruption: handleDismiss,
      addNote: handleAddNote,
    };
  } catch (error) {
    console.warn('Convex disruptions API not available. Please run: npx convex deploy');
    return mockData;
  }
}

// Hook for managing disruption filters
export function useDisruptionFilters() {
  const [filters, setFilters] = useState({
    types: [],
    severities: [],
    statuses: ["active"],
    routes: [],
    supervisorDismissed: false,
  });

  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      types: [],
      severities: [],
      statuses: ["active"],
      routes: [],
      supervisorDismissed: false,
    });
  }, []);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value && (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    activeFilterCount,
  };
}
