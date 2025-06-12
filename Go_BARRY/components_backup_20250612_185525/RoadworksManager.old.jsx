// Create Roadwork Modal Component
const CreateRoadworkModal = ({ visible, onClose, onCreate, loading, session }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    authority: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    plannedStartDate: '',
    plannedEndDate: '',
    estimatedDuration: '',
    roadworkType: 'general',
    trafficManagement: 'traffic_control',
    priority: 'medium'
  });

  const priorities = [
    { value: 'critical', label: 'Critical', color: '#DC2626' },
    { value: 'high', label: 'High', color: '#EA580C' },
    { value: 'medium', label: 'Medium', color: '#D97706' },
    { value: 'low', label: 'Low', color: '#65A30D' },
    { value: 'planned', label: 'Planned', color: '#7C3AED' }
  ];

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.location.trim()) {
      alert('Error: Title and location are required.');
      return;
    }

    onCreate(formData);
  };

  if (!visible) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>Create New Roadwork</div>
          <button onClick={onClose} style={styles.modalCloseButton}>
            ✕
          </button>
        </div>

        <div style={styles.modalContent}>
          {/* Basic Information */}
          <div style={styles.sectionTitle}>Basic Information</div>
          
          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Title *</div>
            <input
              style={styles.textInput}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., A1 Northbound Road Surface Repairs"
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Location *</div>
            <input
              style={styles.textInput}
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g., A1 Northbound, Newcastle"
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Description</div>
            <textarea
              style={{...styles.textInput, ...styles.textArea}}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the roadworks and expected impact..."
              rows={3}
            />
          </div>

          {/* Contact Information */}
          <div style={styles.sectionTitle}>Contact Information</div>
          
          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Authority</div>
            <input
              style={styles.textInput}
              value={formData.authority}
              onChange={(e) => setFormData({...formData, authority: e.target.value})}
              placeholder="e.g., Newcastle City Council"
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Contact Person</div>
            <input
              style={styles.textInput}
              value={formData.contactPerson}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              placeholder="Contact person name"
            />
          </div>

          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <div style={styles.inputLabel}>Phone</div>
              <input
                style={styles.textInput}
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                placeholder="0191 123 4567"
                type="tel"
              />
            </div>
            
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <div style={styles.inputLabel}>Email</div>
              <input
                style={styles.textInput}
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                placeholder="contact@council.gov.uk"
                type="email"
              />
            </div>
          </div>

          {/* Classification */}
          <div style={styles.sectionTitle}>Classification</div>
          
          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Priority Level</div>
            <div style={styles.prioritySelector}>
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  style={{
                    ...styles.priorityOption,
                    ...(formData.priority === priority.value && {
                      backgroundColor: `${priority.color}15`,
                      borderColor: priority.color
                    })
                  }}
                  onClick={() => setFormData({...formData, priority: priority.value})}
                >
                  <span style={{
                    ...styles.priorityOptionText,
                    ...(formData.priority === priority.value && { color: priority.color })
                  }}>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div style={styles.sectionTitle}>Timing</div>
          
          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>Estimated Duration</div>
            <input
              style={styles.textInput}
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
              placeholder="e.g., 3 days, 2 weeks"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={styles.modalActions}>
          <button 
            style={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          
          <button 
            style={{...styles.createSubmitButton, ...(loading && styles.buttonDisabled)}}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                ✓ Create Roadwork
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
                import React, { useState, useEffect } from 'react';

// Mock supervisor session hook
const useSupervisorSession = () => {
  return {
    session: {
      sessionId: 'demo_session_123',
      supervisor: {
        id: 'supervisor001',
        name: 'Demo Supervisor',
        role: 'Senior Supervisor'
      }
    }
  };
};

const RoadworksManager = ({ visible = true, onClose = () => {}, session }) => {
  // State management
  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [stats, setStats] = useState({
    total: 3,
    promotedToDisplay: 1,
    activeDiversions: 2,
    pendingTasks: 5
  });

  // Mock supervisor session if not provided
  const { session: mockSession } = useSupervisorSession();
  const supervisorSession = session || mockSession;

  // Roadworks statuses with colors
  const ROADWORKS_STATUSES = {
    reported: { label: 'Reported', color: '#EF4444', icon: 'alert-circle' },
    assessing: { label: 'Assessing', color: '#F59E0B', icon: 'search' },
    planning: { label: 'Planning', color: '#3B82F6', icon: 'map' },
    approved: { label: 'Approved', color: '#8B5CF6', icon: 'checkmark-circle' },
    active: { label: 'Active', color: '#10B981', icon: 'play-circle' },
    monitoring: { label: 'Monitoring', color: '#06B6D4', icon: 'eye' },
    completed: { label: 'Completed', color: '#6B7280', icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'close-circle' }
  };

  // Priority levels with colors
  const PRIORITY_LEVELS = {
    critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
    high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
    medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
    low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
    planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
  };

  // Sample roadworks data
  const [sampleRoadworks] = useState([
    {
      id: 'roadwork_001',
      title: 'A1 Northbound Road Surface Repairs',
      description: 'Major road surface repairs affecting both lanes between Junction 65 and 66. Expected delays of 10-15 minutes.',
      location: 'A1 Northbound, Birtley Junction 65',
      coordinates: { latitude: 54.9158, longitude: -1.5721 },
      authority: 'National Highways',
      contactPerson: 'John Smith',
      contactPhone: '0191 123 4567',
      contactEmail: 'j.smith@nationalhighways.co.uk',
      plannedStartDate: '2025-06-10T06:00:00.000Z',
      plannedEndDate: '2025-06-12T18:00:00.000Z',
      estimatedDuration: '3 days',
      roadworkType: 'road_surface',
      trafficManagement: 'traffic_lights',
      priority: 'high',
      affectedRoutes: ['21', 'X21', '10', '12', '25'],
      status: 'planning',
      assignedTo: 'supervisor001',
      assignedToName: 'Demo Supervisor',
      createdBy: 'supervisor001',
      createdByName: 'Demo Supervisor',
      createdAt: '2025-06-07T09:00:00.000Z',
      lastUpdated: '2025-06-07T10:30:00.000Z',
      promotedToDisplay: true,
      displayNotes: 'Major route closure affecting key services',
      diversions: [],
      tasks: [
        {
          id: 'task_001',
          title: 'Create Blink PDF Diversion Map',
          type: 'blink_pdf',
          status: 'pending',
          priority: 'urgent'
        }
      ]
    },
    {
      id: 'roadwork_002',
      title: 'Central Station Traffic Light Maintenance',
      description: 'Temporary traffic lights installation for planned maintenance works around Central Station area.',
      location: 'Central Station, Newcastle upon Tyne',
      coordinates: { latitude: 54.9686, longitude: -1.6174 },
      authority: 'Newcastle City Council',
      contactPerson: 'Sarah Johnson',
      contactPhone: '0191 987 6543',
      contactEmail: 's.johnson@newcastle.gov.uk',
      plannedStartDate: '2025-06-15T07:00:00.000Z',
      plannedEndDate: '2025-06-15T19:00:00.000Z',
      estimatedDuration: '1 day',
      roadworkType: 'utilities',
      trafficManagement: 'traffic_lights',
      priority: 'medium',
      affectedRoutes: ['Q3', 'Q3X', '10', '12'],
      status: 'approved',
      assignedTo: 'supervisor002',
      assignedToName: 'Sarah Wilson',
      createdBy: 'supervisor002',
      createdByName: 'Sarah Wilson',
      createdAt: '2025-06-05T14:20:00.000Z',
      lastUpdated: '2025-06-06T16:45:00.000Z',
      promotedToDisplay: false,
      diversions: [],
      tasks: []
    },
    {
      id: 'roadwork_003',
      title: 'Tyne Bridge Inspection Works',
      description: 'Scheduled safety inspection of Tyne Bridge structure requiring temporary lane closures.',
      location: 'Tyne Bridge, Newcastle/Gateshead',
      coordinates: { latitude: 54.9695, longitude: -1.6018 },
      authority: 'Gateshead Council',
      contactPerson: 'David Brown',
      contactPhone: '0191 456 7890',
      contactEmail: 'd.brown@gateshead.gov.uk',
      plannedStartDate: '2025-06-20T22:00:00.000Z',
      plannedEndDate: '2025-06-21T06:00:00.000Z',
      estimatedDuration: '8 hours',
      roadworkType: 'major_works',
      trafficManagement: 'lane_closure',
      priority: 'planned',
      affectedRoutes: ['21', '22', '27'],
      status: 'reported',
      assignedTo: 'supervisor001',
      assignedToName: 'Demo Supervisor',
      createdBy: 'supervisor003',
      createdByName: 'Mike Thompson',
      createdAt: '2025-06-03T11:15:00.000Z',
      lastUpdated: '2025-06-03T11:15:00.000Z',
      promotedToDisplay: false,
      diversions: [],
      tasks: []
    }
  ]);