// Small patch to add coordinate info to the map modal
// This adds a visible coordinate quality badge to the map button

const coordinateQualityBadgeStyles = {
  coordinateQualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    bottom: -8,
    right: -4,
    borderWidth: 1,
  },
  coordinateQualityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
};

// Add this inside the map button after the quality indicator:
/*
{/* Coordinate quality badge */}
<View style={[
  styles.coordinateQualityBadge,
  { 
    borderColor: assessCoordinateQuality(item).color,
    backgroundColor: `${assessCoordinateQuality(item).color}15`
  }
]}>
  <MaterialCommunityIcons 
    name={
      coordinateQuality.quality === 'high' ? 'crosshairs-gps' :
      coordinateQuality.quality === 'medium' ? 'map-marker-radius' :
      coordinateQuality.quality === 'low' ? 'map-marker-question' :
      'map-search'
    }
    size={10} 
    color={assessCoordinateQuality(item).color}
  />
  <Text style={[
    styles.coordinateQualityText,
    { color: assessCoordinateQuality(item).color }
  ]}>
    {coordinateQuality.quality === 'high' ? 'GPS' :
     coordinateQuality.quality === 'medium' ? 'Approx' :
     coordinateQuality.quality === 'low' ? 'Area' :
     'Search'}
  </Text>
</View>
*/
