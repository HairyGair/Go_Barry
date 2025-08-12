#!/bin/bash
# Debug exact Supabase error

echo "================================"
echo "🔍 DEBUGGING EXACT ERROR"
echo "================================"
echo ""

BACKEND_URL="https://go-barry.onrender.com"

echo "1. Testing with minimal data first..."
curl -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"TEST","supervisor_badge":"AG003"}' \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "2. Testing live endpoint to confirm table exists..."
curl -s "$BACKEND_URL/api/breakdowns/live"
echo ""
echo ""

echo "3. Testing with all fields..."
curl -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_number": "6301",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location": "Newcastle",
    "depot_id": "Gateshead",
    "wizard_type": "brakes",
    "route_id": "21"
  }' -i 2>&1 | grep -A 5 "HTTP\|{" 
echo ""

echo "================================"
echo "CHECKING SUPABASE DIRECTLY"
echo "================================"
echo ""
echo "Run this query in Supabase SQL Editor to check table structure:"
echo ""
echo "SELECT column_name, data_type, is_nullable"
echo "FROM information_schema.columns"
echo "WHERE table_name = 'breakdowns';"
echo ""
echo "And check if sequences exist:"
echo "SELECT sequence_name FROM information_schema.sequences;"
echo ""
echo "Try manual insert:"
echo "INSERT INTO breakdowns (fleet_no, supervisor_badge, supervisor_name)"
echo "VALUES ('TEST', 'AG003', 'Test');"
echo ""
