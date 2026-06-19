# syntax=docker/dockerfile:1
# Multi-stage build for the self-hosted LLM X-ray web app (Next.js standalone).
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build reads the JSON snapshot (no DB needed at build); runtime switches to Postgres.
ENV CATALOG_SOURCE=file
RUN npm run build

# Runtime image — standalone server only.
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Migrations are applied at first DB connection (drizzle migrate-on-connect).
COPY --from=builder /app/src/infra/db/migrations ./src/infra/db/migrations
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
