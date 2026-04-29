# Docker Workflow

<!-- SECTION: multi-stage-builds -->
## Multi-Stage Builds

**Pattern:** Separate build dependencies from runtime:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Rules:**
- Use specific version tags (`node:20-alpine`, not `node:latest`)
- Copy package files before source (layer caching)
- Run as non-root user (`USER node`)
- Use `.dockerignore` to exclude `node_modules`, `.git`, `.env`
- Set `HEALTHCHECK` for production images

<!-- SECTION: compose -->
## Docker Compose

**Development compose:** Mount source code, enable hot reload, expose debug ports.

**Production compose:** Use built images, set resource limits, configure restart policies.

**Service dependencies:** Use `depends_on` with `condition: service_healthy` (not just `service_started`).

**Networking:** Use named networks for service isolation. Never expose database ports to host in production.

<!-- SECTION: security-scanning -->
## Security Scanning

**Image scanning:** Run `docker scout cves` or `trivy image` in CI before pushing.

**Base image hygiene:**
- Use minimal base images (alpine, distroless, slim)
- Update base images monthly
- Pin exact versions in FROM
- Never install unnecessary packages

**Secret management:**
- Never COPY `.env` files into images
- Use build-time secrets with `--mount=type=secret` (BuildKit)
- Use runtime secrets via environment variables or mounted volumes
- Rotate secrets without rebuilding images
