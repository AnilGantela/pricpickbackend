#!/bin/bash

echo "📥 Installing dependencies..."
npm install

echo "📥 Installing Puppeteer's Chromium..."
npx puppeteer browsers install

echo "✅ Build completed successfully!"
