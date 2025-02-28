#!/bin/bash
echo "📥 Installing dependencies..."
#!/bin/bash
apt-get update && apt-get install -y \
    chromium-browser \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcups2 \
    libgtk-3-0

npm install
