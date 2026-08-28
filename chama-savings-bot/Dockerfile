# Base image: a pre-built Linux image with Node 20
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
# --legacy-peer-deps works around the bullmq/redis version conflict
RUN npm ci --omit=dev --legacy-peer-deps

# Copy the rest of the source
COPY . .

# The app listens on port 3000
EXPOSE 3000

# Start the app (entry point is server/index.js, per package.json "main")
CMD ["node", "server/index.js"]
