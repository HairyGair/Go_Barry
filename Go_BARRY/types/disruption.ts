// Disruption Types for Go BARRY
export interface Disruption {
  id: string;
  type: 'roadwork' | 'incident' | 'event' | 'weather' | 'breakdown';
  status: 'active' | 'planned' | 'cleared' | 'monitoring';
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Location
  location: {
    description: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    road?: string;
    junction?: string;
    postcode?: string;
  };
  
  // Time
  startTime: Date;
  endTime?: Date;
  lastUpdated: Date;
  timing?: string; // Custom timing description for reports (e.g., "20:00 until 06:00")
  
  // Impact
  affectedRoutes: string[];
  estimatedDelay?: number; // minutes
  
  // Details
  title: string;
  description: string;
  source: string;
  sourceId?: string;
  
  // Start of Service Report Fields
  diversionInstructions?: string; // Detailed diversion instructions for drivers
  customerInformation?: string; // Public-facing passenger information
  serviceAdjustments?: string; // Specific service modifications
  operationalNotes?: string; // Internal operational guidance
  alternativeStops?: AlternativeStop[]; // Temporary stop arrangements
  
  // Supervisor actions
  dismissedBy?: string[];
  notes?: DisruptionNote[];
  priority?: number;
}

export interface AlternativeStop {
  originalStop: string;
  temporaryStop: string;
  instructions: string;
}

export interface DisruptionNote {
  id: string;
  disruptionId: string;
  supervisorBadge: string;
  supervisorName: string;
  content: string;
  timestamp: Date;
  type: 'update' | 'action' | 'observation';
}

export interface DisruptionFilter {
  types?: Disruption['type'][];
  severities?: Disruption['severity'][];
  statuses?: Disruption['status'][];
  routes?: string[];
  supervisorDismissed?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DisruptionSort {
  field: 'severity' | 'startTime' | 'affectedRoutes' | 'location';
  direction: 'asc' | 'desc';
}
