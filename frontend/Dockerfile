# Étape 1 : Build de l'application React
FROM node:20-alpine as build

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (nécessaire pour le build)
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Définir les variables d'environnement pour le build
# Note: Ces variables seront "hardcodées" dans le build statique
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Builder l'application
RUN npm run build

# Étape 2 : Serveur de production Nginx
FROM nginx:alpine

# Copier les fichiers buildés depuis l'étape précédente
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
