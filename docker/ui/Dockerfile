# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: deps
# Install all dependencies including devDeps (needed for Vite + TypeScript).
# =============================================================================
FROM node:22.12-alpine3.21 AS deps

WORKDIR /app

# Copy workspace manifests before source to maximise layer cache reuse.
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json   ./packages/ui/

RUN npm ci

# =============================================================================
# Stage 2: builder
# Compile core (TypeScript) then build the UI (tsc + Vite).
# core must be built first — the UI imports @diagram-builder/core and resolves
# it via the workspace symlink to packages/core/dist/index.js.
# =============================================================================
FROM deps AS builder

# Root tsconfig is extended by each package
COPY tsconfig.json ./

COPY packages/core/ ./packages/core/
COPY packages/ui/   ./packages/ui/

RUN npm run build -w @diagram-builder/core && \
    npm run build -w @diagram-builder/ui

# =============================================================================
# Stage 3: runtime
# Serve the static Vite output via nginx. API and WebSocket traffic is proxied
# to the API service using the nginx config.
# =============================================================================
FROM nginx:1.27-alpine3.21 AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/packages/ui/dist /usr/share/nginx/html
COPY docker/ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
