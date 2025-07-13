#!/bin/bash

# Initialize Git repository for Breakdown Guide App

echo "Initializing Git repository for Breakdown Guide App..."

# Initialize git
git init

# Add initial files
git add .

# Create initial commit
git commit -m "Initial commit: Project structure for Breakdown Guide App v0.1.0

- Created folder structure (src, assets, docs, tests, data)
- Added README.md with project overview
- Added package.json with project metadata
- Added .gitignore for common files
- Set up base for Phase 1.1 development"

echo "Git repository initialized successfully!"
echo "Next steps:"
echo "1. Add remote repository: git remote add origin [your-repo-url]"
echo "2. Push to remote: git push -u origin main"
