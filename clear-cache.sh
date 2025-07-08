#!/bin/bash
# Clear Expo and Metro caches

echo "Clearing Expo and Metro caches..."

# Clear Expo cache
npx expo start --clear

# The above command will start the server, so we'll just use it to clear cache
# You can press Ctrl+C after it starts to stop it
