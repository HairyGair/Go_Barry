// TEMPORARY FIX for RoadworksManagerDashboard.jsx
// Replace the fetchRoadworks function (around line 728) with this:

const fetchRoadworks = async () => {
  try {
    console.log('🚧 [RoadworksManagerDashboard] Starting to fetch roadworks...');
    
    // TEMPORARY: Always use production URL to bypass development proxy issues
    const url = 'https://go-barry.onrender.com/api/roadworks/unified?days=90';
    console.log('🌐 [RoadworksManagerDashboard] Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'omit'
    });
    
    console.log('📡 [RoadworksManagerDashboard] Response status:', response.status);
    console.log('📡 [RoadworksManagerDashboard] Response URL:', response.url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 [RoadworksManagerDashboard] Data received:', {
      success: data.success,
      dataLength: data.data?.length || 0,
      hasData: !!data.data,
      metadata: data.metadata
    });
    
    if (data.success && data.data) {
      const formattedRoadworks = data.data.map(item => ({
        ...item,
        street_name: item.sm_street_name || item.street_name || item.sm_location_description || 'Unknown Location',
        location_description: item.sm_location_description || item.location_description || item.sm_street_name || '',
        start_date: item.sm_start_date || item.start_date || '',
        end_date: item.sm_end_date || item.end_date || '',
        affectedRoutes: item.affectedRoutes || item.affected_routes || [],
        affectedRoutesSummary: item.affectedRoutesSummary || item.affected_routes_summary || '',
        durationDays: item.durationDays || item.duration_days || 1,
        isUrgent: item.isUrgent || item.is_urgent || item.sm_traffic_management_type === 'Road closure',
        coordinates: item.coordinates || null,
        coordinateSource: item.coordinateSource || null,
        coordinateAccuracy: item.coordinateAccuracy || null
      }));
      console.log(`✅ [RoadworksManagerDashboard] Formatted ${formattedRoadworks.length} roadworks`);
      setRoadworks(formattedRoadworks);
      setFilteredRoadworks(formattedRoadworks);
    } else {
      console.error('❌ [RoadworksManagerDashboard] No data in response:', data);
      setError('No roadworks data available');
    }
  } catch (err) {
    console.error('❌ [RoadworksManagerDashboard] Fetch error:', err);
    console.error('❌ [RoadworksManagerDashboard] Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    setError(`Failed to fetch roadworks: ${err.message}`);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// INSTRUCTIONS:
// 1. Open RoadworksManagerDashboard.jsx
// 2. Find the fetchRoadworks function (around line 728)
// 3. Replace the entire function with the code above
// 4. Save the file
// 5. The roadworks should now load from the production server
