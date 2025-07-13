#!/bin/bash

# Simple development server for Breakdown Guide App

echo "🚀 Starting Go North East Breakdown Guide Development Server..."
echo ""
echo "Options:"
echo "1. Python 3 (Recommended)"
echo "2. Python 2"
echo "3. PHP"
echo "4. Node.js (http-server)"
echo ""
read -p "Select server option (1-4): " option

cd src

case $option in
    1)
        echo "Starting Python 3 server..."
        python3 -m http.server 8080
        ;;
    2)
        echo "Starting Python 2 server..."
        python -m SimpleHTTPServer 8080
        ;;
    3)
        echo "Starting PHP server..."
        php -S localhost:8080
        ;;
    4)
        echo "Starting Node.js server..."
        npx http-server -p 8080
        ;;
    *)
        echo "Invalid option. Starting Python 3 server by default..."
        python3 -m http.server 8080
        ;;
esac

echo ""
echo "Server running at: http://localhost:8080"
echo "Press Ctrl+C to stop the server"