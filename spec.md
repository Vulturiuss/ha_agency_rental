# 📸 HA Agency Rental – Specification

## 1. Objectif
Créer une application web de gestion de biens loués (photobooths aujourd’hui, extensible à d’autres équipements), permettant de suivre :
- Les locations
- Les revenus
- Les charges
- La rentabilité
- L’historique des actions avec authentification utilisateur

Application prête à être déployée sur un hébergement Hostinger.

---

## 2. Fonctionnalités principales

### 2.1 Authentification
- Connexion par email + mot de passe
- Création de compte
- Mot de passe hashé (bcrypt)
- JWT pour les sessions
- Chaque action est liée à un utilisateur

---

### 2.2 Gestion des biens loués (Assets)
Un asset représente tout objet louable (photobooth, futur matériel).

**Champs :**
- id
- name
- category (ex: photobooth, autre)
- purchase_price
- purchase_date
- status (available / rented / maintenance)
- created_at

**Fonctionnalités :**
- Ajouter / modifier / supprimer un asset
- Voir la rentabilité totale par asset
- Historique des locations liées

---

### 2.3 Gestion des locations
Une location correspond à un événement.

**Champs :**
- id
- asset_id
- date
- price
- client_name (optionnel)
- location_status (planned / completed / cancelled)
- created_by (user)
- created_at

**Fonctionnalités :**
- Créer / modifier / supprimer une location
- Associer une location à un asset
- Calcul automatique du bénéfice net

---

### 2.4 Gestion des charges (Expenses)

#### Charges réutilisables (templates)
Exemples : Encre, Papier, Transport

**Table : expense_templates**
- id
- name
- default_cost (optionnel)

#### Charges réelles
Liées à une location ou globales.

**Table : expenses**
- id
- location_id (nullable)
- template_id (nullable)
- name
- cost
- created_by
- created_at

**Fonctionnalités :**
- Créer une charge à partir d’un template
- Créer une charge personnalisée
- Historique des charges
- Calcul automatique des totaux

---

### 2.5 Dashboard
Affichage synthétique :
- Revenu total
- Charges totales
- Bénéfice net
- Nombre de locations
- Filtres par période

---

### 2.6 Historique & audit
- Chaque création / modification est liée à un utilisateur
- Date et auteur visibles

---

## 3. Modèle de base de données (MySQL)

### users
- id
- email
- password_hash
- created_at

### assets
- id
- name
- category
- purchase_price
- purchase_date
- status
- created_at

### locations
- id
- asset_id
- date
- price
- client_name
- location_status
- created_by
- created_at

### expense_templates
- id
- name
- default_cost

### expenses
- id
- location_id
- template_id
- name
- cost
- created_by
- created_at

---

## 4. UI / UX

### Design
- Moderne, professionnel
- Mobile / tablette / desktop
- Navigation claire

### Pages
- /login
- /dashboard
- /assets
- /assets/[id]
- /locations
- /expenses
- /settings

---

## 5. Stack technique

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- JWT Auth
- bcrypt

### Database
- MySQL (Hostinger)
- Prisma ORM

---

## 6. Sécurité
- Validation des inputs
- Protection des routes
- Accès restreint aux données par utilisateur

---

## 7. Livraison attendue
- Code complet
- README.md
- Instructions de déploiement Hostinger
- Variables d’environnement documentées
