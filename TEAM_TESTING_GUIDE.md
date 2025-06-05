# 🚦 Go Barry - API Testing Guide for Team

## 🔗 Production API Base URL
```
https://go-barry.onrender.com
```

## 🧪 **Available Alerts Endpoints for Testing**

### 1. **Main Alerts Endpoint** (Recommended for apps)
```
GET https://go-barry.onrender.com/api/alerts
```
- ✅ **Purpose**: Primary alerts feed with caching
- ✅ **Response**: JSON with traffic incidents and alerts
- ✅ **Performance**: Fast responses (cached)
- ✅ **Use in**: Mobile app, web interface, displays

### 2. **Enhanced Alerts** (Advanced features)
```
GET https://go-barry.onrender.com/api/alerts-enhanced
```
- 🚀 **Purpose**: Enhanced with GTFS location accuracy
- 🚀 **Features**: Route matching, stop information, enhanced locations
- 🚀 **Response**: Detailed JSON with route information
- 🚀 **Use in**: Route planning, detailed analysis

### 3. **Test Alerts** (Development)
```
GET https://go-barry.onrender.com/api/alerts-test
```
- 🧪 **Purpose**: Sample test data for development
- 🧪 **Response**: Consistent test alerts
- 🧪 **Use in**: App development, testing

## 🔧 **System Status Endpoints**

### Health Check
```
GET https://go-barry.onrender.com/api/health
```
- Shows system status and memory optimization status

### GTFS Status
```
GET https://go-barry.onrender.com/api/gtfs-status
```
- Shows GTFS processing status and route data

### Service Status
```
GET https://go-barry.onrender.com/api/status
```
- Basic operational status

## 📱 **For Mobile App Integration**

### Environment Configuration
Update your mobile app's API configuration to:
```javascript
const API_BASE_URL = 'https://go-barry.onrender.com';
const ALERTS_ENDPOINT = '/api/alerts';
```

### Example API Call
```javascript
// Fetch alerts for your app
const response = await fetch('https://go-barry.onrender.com/api/alerts');
const data = await response.json();

if (data.success) {
  console.log(`Found ${data.alerts.length} alerts`);
  // Process alerts data
} else {
  console.error('API Error:', data.error);
}
```

## 🖥️ **For Web Interface Integration**

### CORS Headers
The API includes CORS headers for web browser access:
```javascript
fetch('https://go-barry.onrender.com/api/alerts')
  .then(response => response.json())
  .then(data => {
    // Process alerts
    document.getElementById('alerts-count').textContent = data.alerts.length;
  });
```

## 📊 **Expected Response Format**

### Alerts Response Structure
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert_123",
      "type": "incident",
      "title": "Traffic Incident - A1 Northbound",
      "description": "Lane closure due to vehicle breakdown",
      "location": "A1 Northbound, Junction 65 (Birtley)",
      "coordinates": [54.9783, -1.6178],
      "severity": "High",
      "status": "red",
      "affectsRoutes": ["21", "22", "X21"],
      "lastUpdated": "2025-06-05T20:30:00.000Z",
      "source": "tomtom"
    }
  ],
  "metadata": {
    "totalAlerts": 5,
    "lastUpdated": "2025-06-05T20:30:00.000Z",
    "cached": false
  }
}
```

## ✅ **Testing Checklist for Team**

### **Before Testing**
- [ ] Confirm Render deployment is complete
- [ ] Verify API health check returns 200 OK
- [ ] Check memory optimization is active

### **Basic API Testing**
- [ ] `/api/alerts` returns JSON with alerts array
- [ ] Response time is under 10 seconds
- [ ] No memory-related error messages
- [ ] Success field is true

### **Mobile App Testing**
- [ ] App can fetch alerts from production API
- [ ] Alerts display correctly in app interface
- [ ] No CORS or network errors
- [ ] Performance is acceptable

### **Web Interface Testing**
- [ ] Browser can access API endpoints
- [ ] CORS headers allow web requests
- [ ] JSON parsing works correctly
- [ ] Real-time updates function

## 🚨 **Troubleshooting**

### **If API Returns Errors**
1. Check `/api/health` endpoint first
2. Look for memory-related error messages
3. Verify Render deployment completed successfully
4. Check Render logs for optimization messages

### **If Performance is Slow**
1. Check if GTFS processing is still initializing
2. Use `/api/alerts` (cached) instead of `/api/alerts-enhanced`
3. Monitor response times over several requests

### **If No Alerts Returned**
1. Verify external API keys are configured in Render
2. Check `/api/status` for service operational status
3. Try `/api/alerts-test` for sample data

## 📞 **Contact for Issues**

If you encounter problems during testing:
1. Check the API health endpoints first
2. Note exact error messages and response codes
3. Test both `/api/alerts` and `/api/alerts-test`
4. Report any memory-related errors immediately

---

**🎯 Goal**: Verify all Go Barry apps can successfully fetch alerts from the production API without memory crashes.

**✅ Success Criteria**: Apps receive real-time traffic alerts and display them correctly to users.
