# Étape de construction
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Nettoyer le cache npm
RUN npm cache clean --force

# Copier les fichiers de dépendances
COPY package*.json ./

# Installation initiale pour vérification
RUN npm install --cache-min 9999999

# Nettoyage du cache après la première installation
RUN rm -rf ~/.npm

# Copier le reste des fichiers
COPY . .

# Nettoyer à nouveau le cache avant la construction finale
RUN npm cache clean --force && \
    npm install --prefer-offline && \
    npm dedupe

# Construire l'application
RUN npm run build

# Étape d'exécution
FROM nginx:alpine

# Copier les fichiers construits depuis l'étape de construction
COPY --from=builder /app/build /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
