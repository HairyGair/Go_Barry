# VIX Late Runners Integration

## Setup Instructions

### 1. Install Required Dependencies

First, you need to install the xlsx package in the backend:

```bash
cd backend
npm install xlsx
```

### 2. Backend API is Ready

The VIX API has been created at `/backend/routes/vixAPI.js` and registered in the main index.js file. It provides:

- `POST /api/vix/upload` - Upload and process VIX Excel files
- `GET /api/vix/status` - Check API status

### 3. Frontend Components Added

The following components have been created:

- **LateRunnersWidget** (`/Go_BARRY/components/LateRunnersWidget.jsx`) - Displays top 5 late runners
- **VixUploadButton** (`/Go_BARRY/components/VixUploadButton.jsx`) - Upload button for VIX files
- **useVixData** hook (`/Go_BARRY/components/hooks/useVixData.js`) - Manages VIX data state

### 4. Display Screen Updated

The Display Screen now includes:
- Late runners widget showing top 5 delayed buses
- Upload button for manual VIX file uploads
- Real-time display of delays with color coding:
  - Red: >20 minutes late
  - Orange: 10-20 minutes late
  - Yellow: <10 minutes late

## How to Use

1. **Upload VIX Data**:
   - Click the "Upload VIX" button on the Display Screen
   - Select your VIX Late Runners Excel file
   - The file will be processed and late runners displayed

2. **View Late Runners**:
   - Top 5 most delayed buses shown automatically
   - Shows route number, fleet number, location, and delay time
   - Updates show data age and statistics

## Data Format

The VIX Excel file should have columns:
- Fleet No
- Service
- Depot
- RB
- Stop
- Driver No
- Lateness (format: HH:MM:SS)

## Next Steps

To fully implement this feature:

1. Install xlsx package in backend: `npm install xlsx`
2. Restart the backend server
3. Test with a VIX Excel file

The system is designed to handle Excel files up to 10MB and will show the most critical delays prominently on the control room display.