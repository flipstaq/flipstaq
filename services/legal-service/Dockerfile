FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/db ./packages/db

# Copy legal service
COPY services/legal-service ./services/legal-service

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build --workspace=@flipstaq/legal-service

# Expose port
EXPOSE 3005

# Start the service
CMD ["npm", "run", "start:prod", "--workspace=@flipstaq/legal-service"]
