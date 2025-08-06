// Enhanced fetch function with better error handling
const fetchRoadworksEnhanced = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  try {
    console.log('🚧 [RoadworksManagerDashboard] Starting to fetch roadworks...');
    setError(null); // Clear any previous errors
    
    // Determine the correct base URL
    const getBaseUrl = () => {
      // In production, always use absolute URL
      if (window.location.hostname === 'www.gobarry.co.uk' || window.location.hostname === 'gobarry.co.uk') {
        return 'https://go-barry.onrender.com';
      }
      // In development, use relative URLs to avoid CORS
      if (process.env.NODE_ENV === 'development') {
        return '';
      }
      // Fallback to environment variable or default
      return process.env.REACT_APP_API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com';
    };
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/roadworks/unified?days=90`;
    console.log('🌐 [RoadworksManagerDashboard] Fetching from:', url);
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Prevent stale data
      },
      credentials: process.env.NODE_ENV === 'development' ? 'include' : 'omit',
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
    
    console.log('📡 [RoadworksManagerDashboard] Response status:', response.status);
    console.log('📡 [RoadworksManagerDashboard] Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle different response statuses
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to view roadworks.');
    } else if (response.status === 404) {
      throw new Error('Roadworks API endpoint not found. Please contact support.');
    } else if (response.status >= 500) {
      throw new Error(`Server error (${response.status}). The service may be temporarily unavailable.`);
    } else if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ [RoadworksManagerDashboard] Response is not JSON:', contentType);
      const text = await response.text();
      console.error('📄 Response body:', text.substring(0, 500));
      throw new Error('Invalid response format from server');
    }
    
    const data = await response.json();
    console.log('📊 [RoadworksManagerDashboard] Data received:', {
      success: data.success,
      dataLength: data.data?.length || 0,
      hasData: !!data.data,
      sampleData: data.data?.[0] // Log first item for debugging
    });
    
    if (data.success && data.data) {
      const formattedRoadworks = data.data.map(item => ({
        ...item,
        // Map Street Manager fields to component fields
        street_name: item.sm_street_name || item.street_name || item.sm_location_description || 'Unknown Location',
        location_description: item.sm_location_description || item.location_description || item.sm_street_name || '',
        start_date: item.sm_start_date || item.start_date || '',
        end_date: item.sm_end_date || item.end_date || '',
        affectedRoutes: item.affectedRoutes || item.affected_routes || [],
        affectedRoutesSummary: item.affectedRoutesSummary || item.affected_routes_summary || '',
        durationDays: item.durationDays || item.duration_days || 1,
        isUrgent: item.isUrgent || item.is_urgent || item.sm_traffic_management_type === 'Road closure',
        // Include coordinates from backend processing
        coordinates: item.coordinates || null,
        coordinateSource: item.coordinateSource || null,
        coordinateAccuracy: item.coordinateAccuracy || null,
        // Add severity scoring for sorting
        severityScore: calculateSeverityScore(item)
      }));
      
      // Sort by severity score (highest first)
      formattedRoadworks.sort((a, b) => b.severityScore - a.severityScore);
      
      console.log(`✅ [RoadworksManagerDashboard] Formatted ${formattedRoadworks.length} roadworks`);
      setRoadworks(formattedRoadworks);
      setFilteredRoadworks(formattedRoadworks);
      
      // Cache the data for offline use
      if (Platform.OS === 'web' && 'localStorage' in window) {
        try {
          localStorage.setItem('roadworks_cache', JSON.stringify({
            data: formattedRoadworks.slice(0, 50), // Cache first 50 for performance
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          console.warn('Failed to cache roadworks data:', e);
        }
      }
    } else {
      console.error('❌ [RoadworksManagerDashboard] No data in response:', data);
      throw new Error(data.error || 'No roadworks data available');
    }
  } catch (err) {
    console.error('❌ [RoadworksManagerDashboard] Fetch error:', err);
    console.error('❌ [RoadworksManagerDashboard] Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      retryCount
    });
    
    // Handle specific error types
    if (err.name === 'AbortError') {
      err.message = 'Request timed out. The server may be slow or unreachable.';
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      err.message = 'Network connection failed. Please check your internet connection.';
    }
    
    // Retry logic for network errors
    if (retryCount < MAX_RETRIES && (err.name === 'AbortError' || err.message.includes('Network'))) {
      console.log(`🔄 Retrying in ${RETRY_DELAY}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchRoadworksEnhanced(retryCount + 1);
    }
    
    // Try to load from cache if available
    if (Platform.OS === 'web' && 'localStorage' in window) {
      try {
        const cached = localStorage.getItem('roadworks_cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(timestamp).getTime();
          const ONE_HOUR = 60 * 60 * 1000;
          
          if (cacheAge < ONE_HOUR) {
            console.log('📦 Loading from cache due to network error');
            setRoadworks(data);
            setFilteredRoadworks(data);
            setError(`Using cached data from ${new Date(timestamp).toLocaleTimeString()}. ${err.message}`);
            return;
          }
        }
      } catch (cacheError) {
        console.error('Failed to load from cache:', cacheError);
      }
    }
    
    setError(`Failed to fetch roadworks: ${err.message}`);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// Calculate severity score for sorting
const calculateSeverityScore = (item) => {
  let score = 0;
  
  // Traffic management type scoring
  if (item.sm_traffic_management_type === 'Road closure') score += 100;
  else if (item.sm_traffic_management_type === 'Two-way signals') score += 50;
  else if (item.sm_traffic_management_type === 'Multi-way signals') score += 40;
  else if (item.sm_traffic_management_type === 'Lane closure') score += 30;
  else if (item.sm_traffic_management_type === 'Some carriageway incursion') score += 20;
  
  // Works category scoring
  if (item.sm_works_category === 'immediate_emergency') score += 80;
  else if (item.sm_works_category === 'major') score += 60;
  else if (item.sm_works_category === 'standard') score += 30;
  else if (item.sm_works_category === 'minor') score += 10;
  
  // Affected routes scoring
  const affectedRoutesCount = item.affectedRoutes?.length || 0;
  score += Math.min(affectedRoutesCount * 10, 50); // Max 50 points for routes
  
  // Duration scoring
  const duration = calculateDuration(item);
  if (duration > 30) score += 30;
  else if (duration > 14) score += 20;
  else if (duration > 7) score += 10;
  
  // Traffic sensitive scoring
  if (item.sm_traffic_sensitive) score += 20;
  
  return score;
};

// Replace the existing fetchRoadworks function with this enhanced version
const fetchRoadworks = fetchRoadworksEnhanced;
