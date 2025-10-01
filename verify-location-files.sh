#!/bin/bash

# Verify all location capture files are in place
echo "================================================"
echo "📍 LOCATION CAPTURE FILE VERIFICATION"
echo "================================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check main test file
echo "Checking test files..."
if [ -f "test-location-capture.html" ]; then
    echo -e "${GREEN}✅${NC} test-location-capture.html"
else
    echo -e "${RED}❌${NC} test-location-capture.html - NOT FOUND"
fi

if [ -f "test-api-location.html" ]; then
    echo -e "${GREEN}✅${NC} test-api-location.html"
else
    echo -e "${RED}❌${NC} test-api-location.html - NOT FOUND"
fi

if [ -f "location-system-status.html" ]; then
    echo -e "${GREEN}✅${NC} location-system-status.html"
else
    echo -e "${RED}❌${NC} location-system-status.html - NOT FOUND"
fi

echo ""
echo "Checking core module files..."
if [ -f "Go_BARRY/public/breakdown-guide/location-capture-control-room.js" ]; then
    echo -e "${GREEN}✅${NC} location-capture-control-room.js"
    ls -lh "Go_BARRY/public/breakdown-guide/location-capture-control-room.js" | awk '{print "   Size: " $5 " bytes"}'
else
    echo -e "${RED}❌${NC} location-capture-control-room.js - NOT FOUND"
fi

if [ -f "Go_BARRY/public/breakdown-guide/location-capture-styles.css" ]; then
    echo -e "${GREEN}✅${NC} location-capture-styles.css"
    ls -lh "Go_BARRY/public/breakdown-guide/location-capture-styles.css" | awk '{print "   Size: " $5 " bytes"}'
else
    echo -e "${RED}❌${NC} location-capture-styles.css - NOT FOUND"
fi

echo ""
echo "Checking documentation..."
if [ -f "LOCATION_CAPTURE_IMPLEMENTATION.md" ]; then
    echo -e "${GREEN}✅${NC} LOCATION_CAPTURE_IMPLEMENTATION.md"
else
    echo -e "${RED}❌${NC} LOCATION_CAPTURE_IMPLEMENTATION.md - NOT FOUND"
fi

if [ -f "NEXT_STEPS_AFTER_MIGRATION.md" ]; then
    echo -e "${GREEN}✅${NC} NEXT_STEPS_AFTER_MIGRATION.md"
else
    echo -e "${RED}❌${NC} NEXT_STEPS_AFTER_MIGRATION.md - NOT FOUND"
fi

echo ""
echo "Checking database migration..."
if [ -f "location-capture-migration.sql" ]; then
    echo -e "${GREEN}✅${NC} location-capture-migration.sql"
else
    echo -e "${RED}❌${NC} location-capture-migration.sql - NOT FOUND"
fi

echo ""
echo "================================================"
echo "📋 QUICK ACTIONS"
echo "================================================"
echo ""
echo "1. Test location capture UI:"
echo "   open test-location-capture.html"
echo ""
echo "2. Check system status:"
echo "   open location-system-status.html"
echo ""
echo "3. Test API with location:"
echo "   open test-api-location.html"
echo ""
echo "4. View enhanced dashboard:"
echo "   open enhanced-breakdown-dashboard-location.html"
echo ""
echo "================================================"