FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies (better-sqlite3)
RUN npm ci --only=production --no-audit

# Copy backend source code
COPY backend/ ./

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads/products

# Expose port
EXPOSE 3001

# Start the backend server
CMD ["npm", "start"]