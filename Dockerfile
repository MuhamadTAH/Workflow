FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --no-audit --no-optional

# Copy source code (excluding frontend)
COPY index.js ./
COPY db.js ./
COPY routes/ ./routes/
COPY controllers/ ./controllers/
COPY services/ ./services/
COPY nodes/ ./nodes/
COPY utils/ ./utils/
COPY middleware/ ./middleware/

# Create uploads directory
RUN mkdir -p uploads/products

# Expose port
EXPOSE 3001

# Start application  
CMD ["npm", "start"]