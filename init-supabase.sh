#!/bin/bash
# Script to initialize Supabase supervisor sessions table

echo "🔧 Initializing Supabase supervisor_sessions table..."
echo ""
echo "Step 1: First, make sure you've created the table in Supabase"
echo "-------------------------------------------------------"
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and run the contents of create-supervisor-sessions-table.sql"
echo ""
echo "Step 2: Running initialization script..."
echo "---------------------------------------"

# Navigate to backend directory
cd backend

# Run the initialization script
node init-supabase-supervisor-sessions.js

echo ""
echo "✅ Done!"