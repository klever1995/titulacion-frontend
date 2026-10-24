# Etapa 1: Construir la aplicación con Node
FROM node:20-alpine as build

WORKDIR /app

# Copiar dependencias e instalarlas
COPY package*.json ./
RUN npm install

# Copiar el resto del código y construir
COPY . .
# Asegurarnos de que use la URL de la API en producción
ENV VITE_API_URL=http://167.172.159.222:8010/api/v1
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos en la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]