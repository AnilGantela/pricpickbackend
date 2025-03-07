# Use the official Puppeteer image with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy all files
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
