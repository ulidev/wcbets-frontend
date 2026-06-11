# ── Build stage ──────────────────────────────────────────────────────────────
FROM --platform=linux/amd64 node:22.18.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_BASE_URL is only used at build time for the dev-server proxy;
# the production build uses the nginx proxy configured at runtime.
RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM --platform=linux/amd64 nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
