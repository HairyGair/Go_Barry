// Emergency sample data filter
export function removeSampleData(alerts) {
  if (!Array.isArray(alerts)) return [];
  
  // Filter out any alerts that match sample data patterns
  return alerts.filter(alert => {
    // Remove anything with sample IDs
    if (alert.id && (
      alert.id.includes('barry_v3') ||
      alert.id.includes('sample') ||
      alert.id.includes('test') ||
      alert.id.includes('demo')
    )) {
      console.log('🗑️ Filtered out sample alert:', alert.id);
      return false;
    }
    
    // Remove anything with sample sources
    if (alert.source && (
      alert.source === 'go_barry_v3' ||
      alert.source === 'sample' ||
      alert.source === 'test' ||
      alert.source === 'demo'
    )) {
      console.log('🗑️ Filtered out sample source:', alert.source);
      return false;
    }
    
    // Remove anything with sample descriptions
    if (alert.description && (
      alert.description.includes('Junction 65') ||
      alert.description.includes('Junction 66') ||
      alert.description.includes('Recovery vehicle en route') ||
      alert.description.includes('Temporary traffic lights in operation')
    )) {
      console.log('🗑️ Filtered out sample description:', alert.description.substring(0, 50));
      return false;
    }
    
    // Remove anything with sample locations
    if (alert.location && (
      alert.location.includes('Central Station, Newcastle upon Tyne') ||
      alert.location.includes('Tyne Tunnel, North Shields') ||
      alert.location.includes('A1 Northbound, Junction 65')
    )) {
      console.log('🗑️ Filtered out sample location:', alert.location);
      return false;
    }
    
    // Remove anything with enhancedFeatures metadata
    if (alert.enhancedFeatures || alert.enhanced === true) {
      console.log('🗑️ Filtered out enhanced sample alert:', alert.id);
      return false;
    }
    
    return true;
  });
}

export function filterMetadata(metadata) {
  if (!metadata) return metadata;
  
  // Remove sample metadata
  if (metadata.mode === 'go-barry-v3-enhanced') {
    metadata.mode = 'live_data_only';
  }
  
  // Remove enhancedFeatures
  delete metadata.enhancedFeatures;
  
  return metadata;
}
