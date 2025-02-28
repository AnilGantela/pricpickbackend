#!/bin/bash

echo "🔄 Updating package lists..."
apt-get update && apt-get install -y wget

echo "📥 Installing Chromium..."
apt-get install -y chromium-browser

echo "✅ Chromium installed successfully!"

echo "📦 Installing dependencies..."
npm install

echo "🚀 Build completed successfully!"
