# Use the official Puppeteer image with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files before changing ownership
COPY package*.json ./

# Install dependencies as root to avoid permission issues
USER root
RUN chown -R pptruser:pptruser /app
RUN npm install --omit=dev  

# Switch to Puppeteer user
USER pptruser

# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
