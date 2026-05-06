# Etapa 1: Construcción (Build)
FROM node:20 AS build
WORKDIR /app

# Definir argumentos para el build
ARG PUBLIC_API_URL
ARG PUBLIC_WEGLOT_API_KEY
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_WEGLOT_API_KEY=$PUBLIC_WEGLOT_API_KEY

COPY package*.json ./
# Eliminamos el lock para forzar la descarga de binarios correctos para Linux
RUN rm -f package-lock.json && npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
