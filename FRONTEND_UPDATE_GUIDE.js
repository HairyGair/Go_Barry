// Frontend Update for RoadworksManagerDashboard.jsx
// Add this to handle the increased data and use the new this-week endpoint

// 1. Update the fetchRoadworks function to handle more data:
const fetchRoadworks = async () => {
  try {
    setLoading(true);
    
    // Fetch main roadworks data (now up to 2000)
    const response = await fetch('https://go-barry.onrender.com/api/roadworks/unified');
    const data = await response.json();
    
    if (data.success) {
      // Process in batches to avoid UI freezing
      const batchSize = 100;
      const allRoadworks = data.data || [];
      
      // Load first batch immediately
      setRoadworks(allRoadworks.slice(0, batchSize));
      
      // Load remaining in background
      if (allRoadworks.length > batchSize) {
        setTimeout(() => {
          setRoadworks(allRoadworks);
        }, 100);
      }
      
      console.log(`Loaded ${allRoadworks.length} roadworks (was limited to 300)`);
    }
  } catch (error) {
    console.error('Failed to fetch roadworks:', error);
  } finally {
    setLoading(false);
  }
};

// 2. Add a separate function for This Week tab:
const fetchThisWeekRoadworks = async () => {
  try {
    setThisWeekLoading(true);
    
    const response = await fetch('https://go-barry.onrender.com/api/roadworks/this-week');
    const data = await response.json();
    
    if (data.success) {
      setThisWeekRoadworks(data.data);
      
      // Show categories in console
      console.log('This week roadworks:', {
        total: data.metadata.count,
        starting: data.metadata.categories.startingThisWeek,
        ongoing: data.metadata.categories.ongoingThisWeek,
        ending: data.metadata.categories.endingThisWeek
      });
    }
  } catch (error) {
    console.error('Failed to fetch this week roadworks:', error);
  } finally {
    setThisWeekLoading(false);
  }
};

// 3. Update the tab content to show proper loading states:
{activeTab === 'thisWeek' && (
  <View style={styles.tabContent}>
    {thisWeekLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading this week's roadworks...</Text>
      </View>
    ) : thisWeekRoadworks.length === 0 ? (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="calendar-blank" size={48} color="#6b7280" />
        <Text style={styles.emptyText}>No roadworks scheduled for this week</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchThisWeekRoadworks}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <ScrollView>
        {/* Group by category */}
        {thisWeekRoadworks.filter(r => r.weekCategory === 'starting').length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Starting This Week</Text>
            {thisWeekRoadworks
              .filter(r => r.weekCategory === 'starting')
              .map(roadwork => renderRoadworkCard(roadwork))
            }
          </View>
        )}
        
        {thisWeekRoadworks.filter(r => r.weekCategory === 'ongoing').length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Ongoing This Week</Text>
            {thisWeekRoadworks
              .filter(r => r.weekCategory === 'ongoing')
              .map(roadwork => renderRoadworkCard(roadwork))
            }
          </View>
        )}
        
        {thisWeekRoadworks.filter(r => r.weekCategory === 'ending').length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Ending This Week</Text>
            {thisWeekRoadworks
              .filter(r => r.weekCategory === 'ending')
              .map(roadwork => renderRoadworkCard(roadwork))
            }
          </View>
        )}
      </ScrollView>
    )}
  </View>
)}

// 4. Add performance optimization for large lists:
const VirtualizedRoadworksList = ({ roadworks }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollPercentage = contentOffset.y / (contentSize.height - layoutMeasurement.height);
    
    const totalItems = roadworks.length;
    const itemsPerScreen = 50;
    const start = Math.floor(scrollPercentage * (totalItems - itemsPerScreen));
    const end = start + itemsPerScreen;
    
    setVisibleRange({ start: Math.max(0, start), end: Math.min(totalItems, end) });
  };
  
  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
      {/* Spacer for items before visible range */}
      <View style={{ height: visibleRange.start * 150 }} />
      
      {/* Render only visible items */}
      {roadworks.slice(visibleRange.start, visibleRange.end).map(roadwork => 
        renderRoadworkCard(roadwork)
      )}
      
      {/* Spacer for items after visible range */}
      <View style={{ height: (roadworks.length - visibleRange.end) * 150 }} />
    </ScrollView>
  );
};

// 5. Add styles for new components:
const styles = StyleSheet.create({
  // ... existing styles ...
  
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  refreshButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#60a5fa',
    fontSize: 14,
  },
});

// 6. Call the appropriate fetch functions:
useEffect(() => {
  if (activeTab === 'active') {
    fetchRoadworks();
  } else if (activeTab === 'thisWeek') {
    fetchThisWeekRoadworks();
  }
}, [activeTab]);
