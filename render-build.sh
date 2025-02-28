#!/bin/bash
#!/bin/bash
echo "Updating package lists..."
apt-get update

echo "Installing Chromium..."
apt-get install -y chromium-browser

which chromium-browser
which google-chrome-stable


npm install

echo "Installation complete!"



