#!/bin/bash

# Script to create a clean backend-only deployment

echo "Creating clean backend deployment structure..."

# Create temporary deployment directory
mkdir -p deploy-backend
cd deploy-backend

# Copy only backend files
cp ../package.json .
cp ../package-lock.json .
cp ../index.js .
cp ../db.js .
cp -r ../routes .
cp -r ../controllers .
cp -r ../services .
cp -r ../nodes .
cp -r ../utils .
cp -r ../middleware .

# Copy Railway config
cp ../Dockerfile .
cp ../railway.toml .
cp ../nixpacks.toml .

# Create minimal .gitignore
echo "node_modules/
*.log
.env" > .gitignore

echo "Backend-only deployment ready in deploy-backend/"
echo "Initialize git and push to Railway from this directory"