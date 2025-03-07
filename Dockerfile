FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files before changing ownership
COPY package*.json ./

# Grant ownership to pptruser before running npm install
USER root
RUN chown -R pptruser:pptruser /app

# Switch to Puppeteer user
USER pptruser

# Install dependencies
RUN npm install --omit=dev  # Avoid permission issues

# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
