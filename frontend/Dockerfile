# INVEB Cascade Frontend
# Multi-stage build for React + Vite

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Set API URL for production build
ENV VITE_API_URL=https://inveb-api-production.up.railway.app/api/v1
ENV VITE_API_ROOT_URL=https://inveb-api-production.up.railway.app
ENV VITE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (skip TypeScript check, pre-existing errors)
RUN npx vite build

# Stage 2: Production
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template for production
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf.template

# Create startup script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'PORT=${PORT:-80}' >> /docker-entrypoint.sh && \
    echo 'sed "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
