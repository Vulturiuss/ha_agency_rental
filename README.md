## HA Agency Rental

Application Next.js (App Router) pour suivre les assets loués (photobooths), les locations, charges et rentabilité. Authentification par email/mot de passe (bcrypt) et JWT stocké en cookie HttpOnly.

### Stack
- Next.js 16 (TypeScript, App Router)
- Tailwind CSS v4
- Prisma (MySQL)
- API Routes (JWT)

### Pré-requis
- Node.js >= 18
- Base MySQL accessible (Hostinger ou autre)
- Variables d'environnement : voir `env.example`

### Installation locale
```bash
npm install
npx prisma generate
# si vous avez déjà une base prête, appliquez vos migrations :
# npx prisma db push   # crée les tables à partir du schema
npm run dev
```

### Variables d'environnement
Copiez `env.example` en `.env` puis renseignez :
- `DATABASE_URL` : URL MySQL (format prisma)
- `JWT_SECRET` : clé secrète pour signer les tokens

### Scripts
- `npm run dev` : lancement local
- `npm run build` : build de production
- `npm start` : exécution du build
- `npx prisma studio` : inspecter la base

### Structure fonctionnelle
- `/login` : connexion / création de compte
- `/dashboard` : KPIs (revenu, charges, net), dernières locations/charges
- `/assets` + `/assets/[id]` : gestion des assets et rentabilité
- `/locations` : gestion des événements
- `/expenses` : templates réutilisables + charges
- `/settings` : infos compte & env vars

### Déploiement Hostinger (Node.js)
1. Créez la base MySQL et récupérez l'URL de connexion.
2. Définissez `DATABASE_URL` et `JWT_SECRET` dans les variables d'environnement du site.
3. Installez les dépendances et générez Prisma :
   ```bash
   npm install
   npx prisma generate
   npx prisma db push   # ou vos migrations existantes
   npm run build
   npm start
   ```
4. Configurez le process manager (PM2 ou équivalent Hostinger) pour exécuter `npm start`.

### Sécurité & séparation des données
- Toutes les requêtes API vérifient le JWT (cookie HttpOnly).
- Les filtres Prisma utilisent `createdById` pour isoler les données d'un utilisateur.
- Validation d'input via Zod côté API.
