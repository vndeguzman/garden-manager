# syntax=docker/dockerfile:1

# ---- deps: install once, cached across builds unless package.json changes
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
RUN npm ci --workspace=@garden/shared --workspace=@garden/backend --include-workspace-root

# ---- build: compile TypeScript for both shared and backend
FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY shared shared
COPY backend backend
RUN npx --workspace=@garden/backend prisma generate
RUN npm run build --workspace=@garden/shared
RUN npm run build --workspace=@garden/backend

# ---- runtime: small final image, prod deps only
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN addgroup -S garden && adduser -S garden -G garden

COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
# npm workspaces install @garden/shared as a symlink into /repo/shared,
# which doesn't exist in this stage — replace it with the real built files.
RUN rm -rf node_modules/@garden/shared && mkdir -p node_modules/@garden/shared
COPY --from=build /repo/shared/dist ./node_modules/@garden/shared/dist
COPY --from=build /repo/shared/package.json ./node_modules/@garden/shared/package.json
COPY --from=build /repo/backend/prisma ./prisma
COPY --from=build /repo/backend/package.json ./package.json
COPY backend/migrate.sh ./migrate.sh
RUN chmod +x ./migrate.sh
RUN chown -R garden:garden \
  /app/node_modules/@prisma \
  /app/node_modules/.prisma \
  /app/node_modules/prisma \
  /app/prisma

USER garden
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./migrate.sh"]
