# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

WORKDIR /app
COPY package*.json ./

# Install only production deps first to leverage caching if possible
RUN npm ci --omit=dev || npm i --omit=dev

# Copy source
COPY . .

# Build server bundle
RUN npm run build:server

# Final runtime image
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what is needed at runtime
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Set environment variables placeholders (override in deploy)
ENV PORT=3000 \
    MONGODB_URI= \
    JWT_SECRET= \
    ENCRYPTION_KEY= \
    REDIS_URL= \
    GOOGLE_MAPS_API_KEY= \
    CORS_ORIGINS=

CMD ["node", "dist/server/node-build.mjs"]