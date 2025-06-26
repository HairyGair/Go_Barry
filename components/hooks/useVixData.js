// Go_BARRY/hooks/useVixData.js
// Hook for managing VIX late runners data

import { useState } from 'react';

const useVixData = () => {
  const [lateRunners, setLateRunners] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [stats, setStats] = useState(null);

  // Process VIX Excel file
  const processVixFile = async (file) => {
    setIsLoading(true);
    setUploadError(null);
    
    try {
      // Read file as base64
      const reader = new FileReader();
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result.split(',')[1]); // Remove data:...;base64, prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send to backend for processing
      const response = await fetch('https://go-barry.onrender.com/api/vix/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData,
          fileName: file.name
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.lateRunners) {
        setLateRunners(data.lateRunners);
        setLastUpdated(new Date());
        setStats(data.stats);
        
        console.log(`✅ VIX data processed: ${data.lateRunners.length} late runners`);
        
        return { 
          success: true, 
          count: data.lateRunners.length,
          stats: data.stats 
        };
      }
      
      throw new Error(data.error || 'No data returned');
    } catch (error) {
      console.error('❌ Error processing VIX file:', error);
      setUploadError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear data
  const clearVixData = () => {
    setLateRunners([]);
    setLastUpdated(null);
    setStats(null);
    setUploadError(null);
  };

  // Get data age in minutes
  const getDataAge = () => {
    if (!lastUpdated) return null;
    const now = new Date();
    const diffMs = now - lastUpdated;
    return Math.floor(diffMs / 60000); // Convert to minutes
  };

  return {
    lateRunners,
    lastUpdated,
    isLoading,
    uploadError,
    stats,
    processVixFile,
    clearVixData,
    dataAge: getDataAge()
  };
};

export default useVixData;