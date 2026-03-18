# Street Bites - Système de Commande

## Équipe

**Binôme :** Krynen & Rousseau
**Formation :** EPSI Bachelor 3 - DevOps
**Année :** 2024-2025

---

## Description

Street Bites est une application de commande en ligne pour un food truck. Les clients consultent le menu, passent commande depuis leur navigateur et suivent l'état de préparation en temps réel. Le gérant gère son menu et les commandes depuis une interface dédiée.

---

## Architecture

Monorepo en **architecture microservices** :

```
street_bites/
├── apps/
│   └── web/                  # Frontend React + Vite (port 5173)
├── services/
│   ├── menu_service/         # Gestion catégories & produits (port 3001)
│   ├── customer_service/     # Gestion clients & historique (port 3002)
│   └── order_service/        # Gestion commandes (port 3003)
└── packages/
    └── shared/               # Types TypeScript partagés
```

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de données | SQLite (1 fichier par service) |
| Documentation API | Swagger / OpenAPI 3.0 |
| Frontend | React 18 + Vite + TypeScript |
| Monorepo | npm workspaces |

---

## Installation

### Prérequis

- Node.js v18 ou supérieur (npm inclus)

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/<username>/street-bites.git
cd street_bites

# 2. Installer toutes les dépendances
npm install

# 3. Générer les clients Prisma
npm -w menu-service run prisma:generate
npm -w customer-service run prisma:generate
npm -w order-service run prisma:generate

# 4. Créer les bases de données
npm run prisma:migrate

# 5. Peupler avec des données d'exemple
npm run prisma:seed

# 6. Lancer tous les services
npm run dev
```

> Les fichiers `.db` SQLite sont inclus dans le repository pour faciliter la correction (cf. consignes du TP). Les étapes 3 à 5 ne sont donc nécessaires qu'en cas de réinitialisation.

---

## URLs

| Service | URL |
|---------|-----|
| Application web | http://localhost:5173 |
| Menu Service API + Swagger | http://localhost:3001/api-docs |
| Customer Service API + Swagger | http://localhost:3002/api-docs |
| Order Service API + Swagger | http://localhost:3003/api-docs |

---

## Fonctionnalités

### Pages frontend

| Page | Route | Description |
|------|-------|-------------|
| Menu | `/` | Catégories et produits, panier flottant |
| Panier | `/cart` | Récapitulatif, formulaire client, historique |
| Confirmation | `/order/:id` | Statut de la commande, rafraîchissement auto |
| Cuisine | `/kitchen` | File de commandes + gestion du menu (gérant) |

### Flux de commande

```
Client → /          Consulte le menu, ajoute au panier
Client → /cart      Saisit son email/nom, valide la commande
                      └─ Order Service vérifie le client (Customer Service)
                      └─ Order Service vérifie les produits (Menu Service)
                      └─ Snapshot des prix dans order_items
Gérant → /kitchen   Confirme → Prépare → Prête → Terminée
                      └─ Au passage en "Terminée" : enregistrement historique (Customer Service)
Client → /cart      Retrouve son historique via son email
```

### Statuts de commande

```
pending → cancelled
pending → confirmed → cancelled
pending → confirmed → preparing → ready → completed
```

---

## Règles métier implémentées

### Menu Service
- Prix minimum : 0.50€
- Temps de préparation : 1 à 60 minutes
- Un produit appartient obligatoirement à une catégorie
- Impossible de supprimer une catégorie contenant des produits
- Ordre d'affichage via `display_order`

### Customer Service
- Email unique et valide
- Téléphone optionnel
- Impossible de supprimer un client avec un historique de commandes

### Order Service
- Vérification existence client et disponibilité des produits
- Snapshot des prix et noms dans `order_items`
- `estimated_ready_at` = maintenant + max(preparation_time) + 5 min
- Annulation uniquement si `pending` ou `confirmed`
- Enregistrement dans l'historique au passage en `completed`
- Au moins 1 article avec quantité ≥ 1

---

## Scripts disponibles

```bash
npm run dev              # Démarre tous les services en parallèle
npm run build            # Build tous les packages
npm run prisma:migrate   # Crée/migre les bases de données
npm run prisma:seed      # Peuple avec des données d'exemple
```

---

## Licence

Projet académique - EPSI 2024-2025
