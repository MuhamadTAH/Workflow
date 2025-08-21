FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Remove existing node_modules and package-lock to ensure clean install
RUN rm -rf node_modules package-lock.json

# Install dependencies fresh
RUN npm install

# Copy source code (excluding node_modules)
COPY . .
RUN rm -rf node_modules

# Install dependencies again to ensure proper architecture
RUN npm install

# Create uploads directory
RUN mkdir -p uploads/products

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]