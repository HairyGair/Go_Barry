#!/bin/bash

echo "🔑 Local API Keys (from .env file):"
echo "=================================="
echo ""

cd backend

# Read .env file and extract keys
if [ -f .env ]; then
    echo "TOMTOM_API_KEY:"
    grep "^TOMTOM_API_KEY=" .env | cut -d= -f2
    echo ""
    
    echo "NATIONAL_HIGHWAYS_API_KEY:"
    grep "^NATIONAL_HIGHWAYS_API_KEY=" .env | cut -d= -f2
    echo ""
    
    echo "HERE_API_KEY:"
    grep "^HERE_API_KEY=" .env | cut -d= -f2
    echo ""
    
    echo "MAPQUEST_API_KEY:"
    grep "^MAPQUEST_API_KEY=" .env | cut -d= -f2
    echo ""
else
    echo "❌ No .env file found in backend directory"
fi

echo "=================================="
echo "⚠️  Copy these EXACT values to Render.com"
echo "🔍 Make sure there are no extra spaces!"
