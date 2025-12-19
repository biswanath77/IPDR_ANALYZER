# Multi-stage Dockerfile for both frontend and backend
# Build frontend: docker build --target frontend -t ipdr-frontend .
# Build backend:  docker build --target backend  -t ipdr-backend  .

#############################################
# Frontend build (static site)
#############################################
FROM node:18-alpine AS node-builder
WORKDIR /app

# Install build deps
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS frontend
COPY --from=node-builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


#############################################
# Backend image
#############################################
FROM python:3.11-slim AS backend
WORKDIR /app

# Install system deps required by pandas/scikit-learn
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code and model artifacts (outputs/ expected at repo root)
COPY outputs /app/outputs
COPY backend/app /app/app
COPY backend/fetch_and_start.py /app/fetch_and_start.py

EXPOSE 8000

# Default command runs the backend service. For deployments that only need the frontend,
# use the `frontend` target when building. Render can be pointed to this Dockerfile
# and configured to build the `backend` target (see Render service settings).
CMD ["python", "/app/fetch_and_start.py"]
