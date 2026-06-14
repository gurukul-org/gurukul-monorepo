FROM node:20-alpine AS base
RUN corepack enable && corepack prepare yarn@4.14.1 --activate

# 1. Prune step
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune api --docker

# 2. Installer step (install dependencies)
FROM base AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install --immutable

# 3. Build step (generate prisma and build app)
FROM installer AS builder-full
WORKDIR /app
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
# Generate prisma client (needs DATABASE_URL or dummy for generation)
RUN DATABASE_URL="postgresql://postgres:password@localhost:5432/db" PRISMA_SKIP_POSTINSTALL_GENERATE=1 yarn workspace api prisma generate
RUN yarn turbo run build --filter=api...

# 4. Runner step (Production image)
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy only built assets and essential production node_modules
COPY --from=builder-full --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder-full --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder-full --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder-full --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder-full --chown=nestjs:nodejs /app/packages ./packages

# Copy Prisma schema, migrations, and config for production runtime
COPY --from=builder-full --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder-full --chown=nestjs:nodejs /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

# Copy entrypoint script
COPY --chown=nestjs:nodejs apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api
ENV PORT=8000
EXPOSE 8000

# Default: run migrations then start (production)
CMD ["./docker-entrypoint.sh"]
