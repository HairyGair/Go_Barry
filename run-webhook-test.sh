# Make scripts executable
chmod +x test-webhook-fix.js
chmod +x deploy-webhook-fix.sh
chmod +x check-streetmanager-structure.sh

# Run the test
echo "Running webhook fix test..."
node test-webhook-fix.js
