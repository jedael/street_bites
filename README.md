# Street Bites

> Application de commande en ligne pour un food truck : les clients consultent le menu, passent commande depuis leur navigateur et suivent la préparation en temps réel, pendant que le gérant pilote ses commandes et son menu depuis une interface dédiée.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Stack](https://img.shields.io/badge/stack-Node.js%20%2B%20React%20%2B%20Prisma-informational)
![Statut](https://img.shields.io/badge/statut-fonctionnel-brightgreen)

---

## Sommaire

- [Présentation](#présentation)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement](#lancement)
- [URLs et documentation](#urls-et-documentation)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Équipe](#équipe)

---

## Présentation

Street Bites est un système de commande pour food truck développé en architecture microservices. Le projet comporte trois services backend indépendants, chacun avec sa propre base de données, et une application web frontend.

**Fonctionnalités principales :**

- Consultation du menu par catégories avec ajout au panier
- Passage de commande avec suivi du statut en temps réel
- Interface gérant pour piloter les commandes et gérer le menu (CRUD catégories et produits)
- Historique de commandes par client via recherche par e-mail

---

## Prérequis

| Outil | Version minimale | Lien |
|-------|-----------------|------|
| Node.js | 18.x | [nodejs.org](https://nodejs.org) |
| npm | 7.x (inclus avec Node.js) | — |

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/<username>/street-bites.git
cd street_bites

# 2. Installer les dépendances de tous les services
npm install

# 3. Générer les clients Prisma (ORM)
npm -w menu-service run prisma:generate
npm -w customer-service run prisma:generate
npm -w order-service run prisma:generate

# 4. Créer les bases de données SQLite
npm run prisma:migrate
# Prisma demande un nom de migration → taper "init" puis Entrée (à répéter 3 fois)

# 5. Peupler avec des données d'exemple
npm run prisma:seed
```

> **Note :** Les fichiers `.db` SQLite sont inclus dans le dépôt pour faciliter la correction (conformément aux consignes du TP). Les étapes 3 à 5 ne sont donc nécessaires qu'en cas de réinitialisation complète.

---

## Lancement

```bash
# Démarrer tous les services en parallèle
npm run dev
```

Les quatre processus (3 services backend + frontend) démarrent automatiquement via `concurrently`.

Pour démarrer un service individuellement :

```bash
npm -w menu-service run dev       # Menu Service
npm -w customer-service run dev   # Customer Service
npm -w order-service run dev      # Order Service
npm -w web run dev                # Application web
```

---

## URLs et documentation

| Service | URL | Documentation |
|---------|-----|---------------|
| Application web | http://localhost:5173 | — |
| Menu Service | http://localhost:3001 | http://localhost:3001/api-docs |
| Customer Service | http://localhost:3002 | http://localhost:3002/api-docs |
| Order Service | http://localhost:3003 | http://localhost:3003/api-docs |

---

## Structure du projet

```
street_bites/
├── apps/
│   └── web/                  # Frontend — React 18 + Vite + TypeScript
├── services/
│   ├── menu_service/         # Gestion des catégories et produits (port 3001)
│   ├── customer_service/     # Gestion des clients et historique (port 3002)
│   └── order_service/        # Gestion des commandes, orchestration (port 3003)
├── packages/
│   └── shared/               # Types TypeScript partagés entre les services
├── package.json              # Configuration du monorepo (npm workspaces)
└── tsconfig.base.json        # Configuration TypeScript de base
```

Chaque service contient :

```
<service>/
├── prisma/
│   ├── schema.prisma         # Schéma de la base de données
│   ├── seed.ts               # Données d'exemple
│   └── <service>.db          # Base de données SQLite
└── src/
    ├── index.ts              # Point d'entrée Express + Swagger
    └── routes/               # Définition des endpoints
```

---

## Fonctionnalités

### Pages de l'application

| Page | Route | Description |
|------|-------|-------------|
| Menu | `/` | Catégories et produits, panier flottant |
| Panier | `/cart` | Récapitulatif, formulaire client, historique par e-mail |
| Confirmation | `/order/:id` | Statut de la commande, rafraîchissement automatique toutes les 10 s |
| Cuisine | `/kitchen` | File de commandes active + CRUD menu (vue gérant) |

### Flux de commande

```
1. Client → ajoute des produits au panier depuis la page Menu
2. Client → valide sur /cart en saisissant son nom et son e-mail
3. Order Service → vérifie le client (Customer Service) et les produits (Menu Service)
4. Order Service → crée la commande avec snapshot des prix et estimation de prêt
5. Gérant → fait avancer la commande : En attente → Confirmée → En préparation → Prête → Terminée
6. Order Service → enregistre la commande dans l'historique du client (Customer Service)
7. Client → retrouve son historique en saisissant son e-mail sur /cart
```

### Statuts d'une commande

```
pending → cancelled
pending → confirmed → cancelled
pending → confirmed → preparing → ready → completed
```

### Règles métier

- Prix minimum d'un produit : 0,50 €
- Temps de préparation : entre 1 et 60 minutes
- Impossible de supprimer une catégorie contenant des produits
- E-mail client unique et valide
- Annulation possible uniquement si la commande est `pending` ou `confirmed`
- Au moins 1 article avec une quantité ≥ 1 par commande

---

## Équipe

| Nom | Formation |
|-----|-----------|
| Krynen | EPSI Bachelor 3 DevOps FullStack — 2024-2025 |
| Rousseau | EPSI Bachelor 3 DevOps FullStack — 2024-2025 |

---

## Licence

Projet académique — EPSI 2024-2025

---

*Dernière mise à jour : mars 2026*
