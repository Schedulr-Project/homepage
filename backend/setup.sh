#!/bin/bash
set -e  # Exit on error

# Navigate to backend directory
cd "$(dirname "$0")"

echo "Setting up Schedulr backend..."

echo "Installing dependencies..."
npm install

echo "Initializing classrooms..."
node scripts/initClassrooms.js

echo "Setup complete!"
echo "You can now start the server with: npm start"
