#!/bin/bash
# Install authentication dependencies for backend

echo "Installing authentication dependencies..."
cd /mnt/f/tracverse/server
npm install jsonwebtoken bcrypt

echo "Dependencies installed successfully!"
echo "Now you can test the authentication system:"
echo "1. Start server: npm start"
echo "2. Run tests: node test-auth-integration.js"
