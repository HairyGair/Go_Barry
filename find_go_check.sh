#!/bin/bash

# Script to find all files containing "Go-Check" or "Go Check" and list them

echo "Finding all files containing 'Go-Check' or 'Go Check'..."

# Check in the main breakdown-guide directory
cd "/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide"

echo -e "\n=== Files in breakdown-guide containing 'Go-Check' ==="
grep -r "Go-Check" . 2>/dev/null | grep -v ".DS_Store" | cut -d: -f1 | sort | uniq

echo -e "\n=== Files in breakdown-guide containing 'Go Check' ==="
grep -r "Go Check" . 2>/dev/null | grep -v ".DS_Store" | cut -d: -f1 | sort | uniq

# Check in the deployment directory
cd "/Users/anthony/Go BARRY App/breakdown-guide-react-deploy"

echo -e "\n=== Files in deployment directory containing 'Go-Check' ==="
grep -r "Go-Check" . 2>/dev/null | grep -v ".DS_Store" | cut -d: -f1 | sort | uniq

echo -e "\n=== Files in deployment directory containing 'Go Check' ==="
grep -r "Go Check" . 2>/dev/null | grep -v ".DS_Store" | cut -d: -f1 | sort | uniq

echo -e "\nSearch complete!"
