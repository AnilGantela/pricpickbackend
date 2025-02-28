#!/bin/bash

echo "Updating package lists..."
apt-get update -y

echo "Installing dependencies..."
apt-get install -y wget unzip

echo "Downloading Chromium..."
wget -qO- https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb > chrome.deb

echo "Installing Chromium..."
dpkg -i chrome.deb || apt-get -fy install  # Fix dependencies if needed

echo "Checking installation..."
which google-chrome-stable || echo "Google Chrome not found!"
google-chrome-stable --version || echo "Failed to verify Chrome version"

echo "Installing npm dependencies..."
npm install

echo "Installation complete!"


