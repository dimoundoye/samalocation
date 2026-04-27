# 🏠 Samalocation

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-00000F?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Samalocation** est une plateforme web moderne conçue pour révolutionner la gestion locative immobilière au Sénégal. Elle offre une solution digitale complète, sécurisée et transparente tant pour les propriétaires que pour les locataires.

---

## 🚀 Vision du Projet

Le marché locatif traditionnel peut être complexe et opaque. Samalocation simplifie cette expérience en digitalisant chaque étape : de la recherche d'un bien à la génération de contrats et de quittances, en passant par la communication directe et sécurisée.

---

## ✨ Fonctionnalités Clés

### 👤 Pour les Locataires
- **Recherche Intelligente :** Filtres avancés par quartier, prix, type de bien, équipements, nombre de chambres **et nombre de pièces**.
- **Carte Interactive :** Visualisation des biens via une carte intégrée (Leaflet).
- **Messagerie Temps-Réel :** Chat direct avec les propriétaires pour poser des questions et organiser des visites.
- **Candidature Simplifiée :** Postulez aux annonces en un clic.
- **Expérience Premium :** Chargement fluide avec des **Skeleton UI** pour une navigation sans scintillement.
- **Espace Personnel :** Suivi des locations actives, téléchargement de quittances et gestion des demandes de maintenance.
-**Signature électronique :** Signature électronique des contrats de location.




### 🏠 Pour les Propriétaires
- **Dashboard Complet :** Gestion centralisée de votre patrimoine immobilier.
- **Publication d'Annonces :** Ajout de biens avec photos, descriptions détaillées et gestion des unités.
- **Assistant IA :** Génération automatique de descriptions d'annonces optimisées via Google Gemini AI.
- **Gestion des Locataires :** Attribution des biens, suivi des paiements et historique locatif.
- **Digitalisation Administrative :** Génération automatique de quittances de loyer au format PDF.
- **Suivi de Maintenance :** Système de tickets pour gérer les réparations et demandes d'entretien.
- **Gestion des Contrats :** Génération automatique de contrats de location au format PDF.
- **Gestion des États des lieux :** Génération automatique d'états des lieux au format PDF.
- **Gestion des Reçus :** Génération automatique de reçus de loyer au format PDF.
- **Multi-collaborateur :** Gestion de plusieurs collaborateurs pour les agences immobilières.

### 🛡️ Sécurité & IA
- **Anti-Bot :** Protection des formulaires via Cloudflare Turnstile.
- **Sécurité Serveur :** Configuration durcie via Nginx (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- **Recherche Smart :** Analyse du langage naturel pour la recherche de biens via l'IA.
- **Authentification :** Sécurisée par JWT (JSON Web Tokens) et hachage de mots de passe (bcrypt).

---

## 🛠️ Stack Technique

### Frontend
- **Framework :** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Langage :** [TypeScript](https://www.typescriptlang.org/)
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/ui](https://ui.shadcn.com/)
- **Gestion d'État :** [Tanstack Query](https://tanstack.com/query/latest)
- **Cartographie :** [Leaflet](https://leafletjs.com/)
- **Animations :** [Framer Motion](https://www.framer.com/motion/)
- **Communication :** [Socket.io-client](https://socket.io/docs/v4/client-api/)

### Backend
- **Runtime :** [Node.js](https://nodejs.org/)
- **Framework API :** [Express.js](https://expressjs.com/)
- **Base de Données :** [PostgreSQL](https://www.postgresql.org/)
- **Real-time :** [Socket.io](https://socket.io/)
- **Intelligence Artificielle :** [Google Gemini AI API](https://ai.google.dev/)
- **Stockage Media :** [Cloudinary](https://cloudinary.com/) (Images)
- **Emailing :** [Nodemailer](https://nodemailer.com/)
- **Documents :** [PDFKit](http://pdfkit.org/) (Quittances)

---

## 📦 Structure du Projet

```bash
samalocation/
├── frontend/             # Application React (Vite)
│   ├── src/
│   │   ├── api/          # Appels API modulaires
│   │   ├── components/   # Composants UI réutilisables
│   │   ├── contexts/     # Contextes (Auth, Chat)
│   │   ├── lib/          # Utilitaires et API client
│   │   └── pages/        # Vues principales de l'application
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── models/       # Modèles SQL
│   │   ├── routes/       # Endpoints API
│   │   ├── middleware/   # Sécurité et validation
│   │   └── utils/        # Générateur PDF, Gemini, etc.
└── .env                  # Variables d'environnement
```

---

## ⚙️ Installation & Configuration

### Prérequis
- Node.js (v18+)
- PostgreSQL
- Comptes : Cloudinary, Google AI Studio (Gemini)

### Option 1 : Docker (Recommandé pour la production)
1. Assurez-vous que Docker et Docker Compose sont installés.
2. Lancez tout le projet : `docker-compose up -d --build`
3. L'application sera accessible sur `http://localhost:8080`.

### Option 2 : Développement local
#### Backend
1. `cd backend`
2. `npm install`
3. Copiez le fichier `.env.example` en `.env` et remplissez les variables.
4. Lancez le serveur : `npm run dev`

#### Frontend
1. `cd frontend`
2. `npm install`
3. Configurez le fichier `.env`.
4. Lancez l'application : `npm run dev`

---

## 📝 Licence

Distribué sous la licence ISC. Voir `LICENSE` pour plus d'informations.

---

## 🤝 Contact

Développé par **Ndoye** - [https://www.linkedin.com/in/khadimou-rassoul-ndoye-3951222a1/  ] [rassoulndoye25@gmail.com]

*Samalocation - La gestion locative en toute confiance.*
