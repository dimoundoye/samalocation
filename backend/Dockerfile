# Utiliser une image Node.js légère
FROM node:20-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --omit=dev --legacy-peer-deps

# Copier le reste du code source
COPY . .

# Créer un dossier pour les uploads s'il n'existe pas
RUN mkdir -p uploads

# Exposer le port de l'application (défini dans .env, ici 5000 par défaut)
EXPOSE 5000

# Lancer l'application
CMD ["npm", "start"]
