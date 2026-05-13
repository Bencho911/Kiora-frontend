# Etapa 1: Construcción (Build)
FROM node:20 AS build
WORKDIR /app

# Definir argumentos para el build
ARG PUBLIC_API_URL
ARG PUBLIC_WEGLOT_API_KEY
ARG PUBLIC_SENTRY_DSN
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_WEGLOT_API_KEY=$PUBLIC_WEGLOT_API_KEY
ENV PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN

COPY package*.json ./
# Usamos npm ci para instalaciones más limpias y muchísimo más rápidas
RUN npm ci
COPY . .
RUN NODE_OPTIONS=--max-old-space-size=1024 npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
