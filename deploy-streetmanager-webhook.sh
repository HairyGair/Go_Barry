#!/bin/bash
# Deploy StreetManager webhook to production

echo "🚀 Deploying StreetManager webhook..."
echo ""

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "Add StreetManager webhook implementation per official docs

- Implements exact example from StreetManager documentation
- Uses bodyParser.text() as required
- Validates SNS signatures
- Auto-confirms subscriptions
- Saves notifications to Supabase
- Added GET status endpoint for testing

Webhook URL: POST https://go-barry.onrender.com/api/streetmanager/webhook
Test URL: GET https://go-barry.onrender.com/api/streetmanager/webhook/test"

# Push to main branch
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Monitor deployment at:"
echo "   https://dashboard.render.com/web/srv-crbnjm52eoe0hpqsqpeg/deploys"
echo ""
echo "⏱️ Deployment usually takes 3-5 minutes"
echo ""
echo "🧪 Once deployed, test with:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/test"
