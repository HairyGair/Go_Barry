# Fleet Analytics Dashboard - User Guide

## Overview
The Fleet Analytics Dashboard has been updated to work directly in the browser without requiring a backend server. It now loads data directly from Excel files (`.xlsx` format).

## How to Use

1. **Access the Dashboard**
   - Navigate to `/breakdown-analytics` from your web server
   - Or click "Fleet Breakdown Analytics Dashboard" from the GO BARRY main menu

2. **Load Your Data**
   - When the dashboard loads, you'll see a file upload interface
   - Drag and drop your `GNE_Fleet_Master.xlsx` file onto the upload area
   - Or click "Select File" to browse and select your Excel file

3. **Excel File Format**
   The dashboard automatically detects and works with various column names. Supported columns include:
   - **Fleet Number**: `Fleet Number`, `fleet_number`, `Vehicle`, `Fleet #`, `Bus`
   - **Depot**: `Depot`, `depot`, `Location`
   - **Category**: `Category`, `Type`, `Breakdown Type`, `Issue`
   - **Date**: `Date`, `Breakdown Date`, `Report Date`
   - **Safety Critical**: `Safety Critical`, `Critical`, `Priority`

4. **Features**
   - **Overview Stats**: Total breakdowns, vehicles affected, safety critical issues, and average per vehicle
   - **Depot Analysis**: Bar chart showing breakdowns by depot
   - **Category Breakdown**: Pie chart showing distribution of breakdown types
   - **Vehicle Reliability**: Table showing worst-performing vehicles with reliability ratings
   - **Recent Breakdowns**: List of recent breakdown records

5. **Filters**
   - **Depot Filter**: Select specific depot or "All Depots"
   - **Time Range**: Last 7 days, 30 days, 90 days, or All Time
   - **Load New File**: Refresh the page or click button to load a different Excel file

## Troubleshooting

- **File Not Loading**: Ensure your file is in `.xlsx` format (not `.xls` or `.csv`)
- **No Data Showing**: Check that your Excel file has data in the expected columns
- **Date Filtering Not Working**: Ensure date values in Excel are properly formatted as dates

## Integration with GO BARRY

The analytics dashboard is now integrated with the GO BARRY breakdown guide:
- Access it from the main menu under "Fleet Analytics"
- The dashboard provides insights that complement the breakdown assessment wizards
- Use the analytics to identify patterns and problematic vehicles

## Notes

- All data processing happens in your browser - no data is sent to any server
- The dashboard works offline once loaded
- Large Excel files (10,000+ rows) may take a moment to process
