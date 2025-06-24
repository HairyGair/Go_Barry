#!/bin/bash

echo "Testing Street Manager Webhook endpoints..."
echo "=========================================="

# Test webhook test endpoint
echo -e "\n1. Testing POST /api/streetmanager/webhook/test:"
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\n2. Testing POST /api/streetmanager/webhook:"
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook \
  -H "Content-Type: application/json" \
  -d '{"Type": "test"}'

echo -e "\n\n3. Testing GET /api/streetmanager/webhook/status again:"
curl https://go-barry.onrender.com/api/streetmanager/webhook/status

echo -e "\n\nDone!"
