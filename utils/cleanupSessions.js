// utils/cleanupSessions.js
// Manual cleanup utility for expired supervisor sessions

export async function cleanupExpiredSessions() {
  try {
    const response = await fetch('https://go-barry.onrender.com/api/supervisor/cleanup-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Session cleanup result:', result);
    return result;
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
    return { success: false, error: error.message };
  }
}

// Run this from browser console if needed:
// await cleanupExpiredSessions()
