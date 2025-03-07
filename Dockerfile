FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Install necessary dependencies
USER root
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO- https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-chrome-keyring.gpg \
    && echo 'deb [signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Change ownership for Puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch to Puppeteer user
USER pptruser

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
