# Utiliser une image Node.js légère
FROM node:20-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances système pour canvas (compilation native) et puppeteer (Chromium)
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pkgconfig \
    python3 \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Désactiver le téléchargement de Chromium par puppeteer (utilise celui d'apk)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Installer les dépendances npm (production uniquement)
RUN npm install --omit=dev --legacy-peer-deps

# Copier le reste du code source
COPY . .

# Créer un dossier pour les uploads s'il n'existe pas
RUN mkdir -p uploads

# Exposer le port de l'application (défini dans .env, ici 5000 par défaut)
EXPOSE 5000

# Lancer l'application
CMD ["npm", "start"]
