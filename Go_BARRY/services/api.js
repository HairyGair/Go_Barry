// Create traffic-watch/services/api.js
const API_BASE = 'https://go-barry.onrender.com/api';

export const fetchAlerts = async () => {
  const response = await fetch(`${API_BASE}/alerts`);
  return response.json();
};