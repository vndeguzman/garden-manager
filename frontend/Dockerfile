# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY shared/package.json shared/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace=@garden/shared --workspace=@garden/frontend --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY shared shared
COPY frontend frontend
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace=@garden/frontend

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
