# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: deps
# Install all dependencies including devDeps (needed for TypeScript compilation)
# and native build tools (needed for tree-sitter bindings).
# =============================================================================
FROM node:22.12-alpine3.21 AS deps

WORKDIR /app

# Build tools required to compile tree-sitter native bindings during npm ci
RUN apk add --no-cache python3 make g++

# Copy workspace manifests before source to maximise layer cache reuse.
# A source change won't invalidate the npm ci layer unless package files change.
COPY package.json package-lock.json ./
COPY packages/core/package.json    ./packages/core/
COPY packages/parser/package.json  ./packages/parser/
COPY packages/api/package.json     ./packages/api/

RUN npm ci

# =============================================================================
# Stage 2: builder
# Compile TypeScript for core → parser → api (dependency order).
# parser/tsconfig.json includes ../core/src/ivm so both source trees must be
# present before building the parser.
# =============================================================================
FROM deps AS builder

# Root tsconfig is extended by each package
COPY tsconfig.json ./

# Copy full source for the three packages the API depends on
COPY packages/core/   ./packages/core/
COPY packages/parser/ ./packages/parser/
COPY packages/api/    ./packages/api/

RUN npm run build -w @diagram-builder/core   && \
    npm run build -w @diagram-builder/parser  && \
    npm run build -w @diagram-builder/api

# Remove devDependencies to reduce the size of node_modules copied to runtime.
# Workspace symlinks (node_modules/@diagram-builder/*) are preserved because
# the internal packages are listed under "dependencies", not "devDependencies".
RUN npm prune --omit=dev

# =============================================================================
# Stage 3: runtime
# Minimal image containing only compiled output and production node_modules.
# =============================================================================
FROM node:22.12-alpine3.21 AS runtime

WORKDIR /app

# Pruned node_modules — includes workspace symlinks pointing to /app/packages/*
COPY --from=builder --chown=node:node /app/node_modules     ./node_modules
COPY --from=builder --chown=node:node /app/package.json     ./

# core — symlink target: node_modules/@diagram-builder/core → packages/core
COPY --from=builder --chown=node:node /app/packages/core/dist        ./packages/core/dist
COPY --from=builder --chown=node:node /app/packages/core/package.json ./packages/core/

# parser — symlink target: node_modules/@diagram-builder/parser → packages/parser
# dist path is packages/parser/dist/parser/src/... (no rootDir in tsconfig)
COPY --from=builder --chown=node:node /app/packages/parser/dist        ./packages/parser/dist
COPY --from=builder --chown=node:node /app/packages/parser/package.json ./packages/parser/

# api
COPY --from=builder --chown=node:node /app/packages/api/dist        ./packages/api/dist
COPY --from=builder --chown=node:node /app/packages/api/package.json ./packages/api/

# Run as the built-in non-root node user
USER node

# Set cwd to the API package so that server.ts path resolution works:
#   resolve(process.cwd(), '../../.env')  =>  /app/.env
# In Docker, env vars are injected directly; dotenv silently no-ops if absent.
WORKDIR /app/packages/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
