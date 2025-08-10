#!/bin/bash

# Make the integration script executable
chmod +x integrate-fleet-database.mjs

echo "🚀 Running Fleet Database Integration..."
node integrate-fleet-database.mjs

echo -e "\n✅ Integration complete!"
echo "Next steps:"
echo "1. Restart the backend server"
echo "2. Test the new features"
echo "3. Check FLEET_DATABASE_INTEGRATION_COMPLETE.md for details"
