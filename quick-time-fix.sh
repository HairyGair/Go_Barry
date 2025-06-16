#!/bin/bash
# Quick fix for business hours display

echo "🕐 Fixing business hours display format..."

git add backend/utils/requestThrottler.js
git commit -m "Fix business hours display: 12:15 AM instead of 12:15 PM"
git push origin main

echo "✅ Business hours fix deployed!"
echo "⏰ Will now show: 6:00 AM - 12:15 AM (18.25h operating)"
