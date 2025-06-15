# Auth Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Copy shared database package from packages/db
COPY ../../packages/db ./packages/db

# Generate Prisma client
RUN npx prisma generate --schema=./packages/db/schema.prisma

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
