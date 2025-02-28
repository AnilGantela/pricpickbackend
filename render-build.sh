#!/bin/bash
# Install required dependencies for Puppeteer
apt-get update && apt-get install -y \
  wget \
  curl \
  unzip \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk1.0-0 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libgbm-dev \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libxrender1 \
  libxtst6 \
  libpangocairo-1.0-0 \
  libpango-1.0-0 \
  libharfbuzz-icu0 \
  libatspi2.0-0 \
  xdg-utils \
  --no-install-recommends

# Install Chrome for Puppeteer
npx puppeteer browsers install chrome
