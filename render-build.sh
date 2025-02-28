#!/bin/bash
echo "Updating package lists..."
sudo apt-get update

echo "Installing Chromium..."
sudo apt-get install -y chromium-browser

npm install

echo "Installation complete!"



