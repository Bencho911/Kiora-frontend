# Etapa 1: Construcción (Build)
FROM node:22 AS build
WORKDIR /app

# Habilitar pnpm via corepack — pinado a v10 para coincidir con el pnpm-lock.yaml local
RUN corepack enable && corepack prepare pnpm@10 --activate

# Definir argumentos para el build (deben coincidir con docker-compose.yml y .env)
ARG PUBLIC_API_URL
ARG PUBLIC_KIORA_API_KEY
ARG PUBLIC_WEGLOT_API_KEY
ARG PUBLIC_SENTRY_DSN
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_KIORA_API_KEY=$PUBLIC_KIORA_API_KEY
ENV PUBLIC_WEGLOT_API_KEY=$PUBLIC_WEGLOT_API_KEY
ENV PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN

# Copiar manifests primero para aprovechar la caché de Docker
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
# Generar tipos de Astro y construir
RUN pnpm exec astro sync && NODE_OPTIONS=--max-old-space-size=1024 pnpm exec astro build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
