FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Install Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y wget \
    && wget -qO- https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb > chrome.deb \
    && dpkg -i chrome.deb || apt-get -fy install

# Copy all files
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
