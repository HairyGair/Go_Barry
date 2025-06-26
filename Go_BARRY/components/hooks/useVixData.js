// Go_BARRY/hooks/useVixData.js
// Hook for managing VIX late runners data

import { useState } from 'react';
import { useConvexSync } from '../../hooks/useConvexSync';
import { useSupervisorSession } from './useSupervisorSession';

const useVixData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  let vixData, updateConvexVixData;
  try {
    const convexSync = useConvexSync();
    vixData = convexSync.vixData;
    updateConvexVixData = convexSync.updateVixData;
  } catch (error) {
    console.warn('VIX Convex functions not available yet');
    vixData = null;
    updateConvexVixData = async () => ({ success: false, error: 'Convex not ready' });
  }
  
  const { supervisorSession } = useSupervisorSession();
  
  // Extract data from Convex
  const lateRunners = vixData?.lateRunners || [];
  const lastUpdated = vixData?.uploadedAt ? new Date(vixData.uploadedAt) : null;
  const stats = vixData?.stats || null;

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
        // Update Convex with the new data if available
        if (updateConvexVixData) {
          await updateConvexVixData({
            lateRunners: data.lateRunners,
            stats: data.stats,
            uploadedBy: supervisorSession?.supervisor?.name || 'Unknown',
            uploadedAt: new Date().toISOString()
          });
          
          console.log(`✅ VIX data processed and synced to Convex: ${data.lateRunners.length} late runners`);
        } else {
          console.log(`✅ VIX data processed: ${data.lateRunners.length} late runners (Convex sync pending)`);
        }
        
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

  // Clear data function is not needed as Convex handles it
  const clearVixData = () => {
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

export { useVixData };
export default useVixData;