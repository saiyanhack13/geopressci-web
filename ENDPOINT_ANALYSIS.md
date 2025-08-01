# ANALYSE DES ENDPOINTS BACKEND NÉCESSAIRES POUR CHAQUE PAGE CLIENT

## 📋 PAGES CLIENT ANALYSÉES

### 🏠 **HomePage.tsx**
**Fonctionnalités** : Recherche géolocalisée, pressings populaires, quartiers
**Endpoints nécessaires** :
- ✅ `GET /api/v1/pressings/nearby` - Pressings géolocalisés (DISPONIBLE)
- ✅ `GET /api/v1/pressings` - Liste pressings avec filtres (DISPONIBLE)
- ❌ `GET /api/v1/pressings/popular` - Pressings populaires (MANQUANT)
- ❌ `GET /api/v1/neighborhoods` - Quartiers d'Abidjan (MANQUANT)

### 🔍 **SearchPage.tsx**
**Fonctionnalités** : Recherche avancée, filtres, géolocalisation, favoris
**Endpoints nécessaires** :
- ✅ `GET /api/v1/pressings` - Recherche avec filtres (DISPONIBLE)
- ✅ `GET /api/v1/pressings/nearby` - Géolocalisation (DISPONIBLE)
- ❌ `GET/POST/DELETE /api/v1/users/favorites` - Gestion favoris (MANQUANT)
- ❌ `GET /api/v1/pressings/search` - Recherche textuelle avancée (MANQUANT)

### 🏪 **PressingDetailPage.tsx**
**Fonctionnalités** : Détails pressing, services, avis, booking
**Endpoints nécessaires** :
- ✅ `GET /api/v1/pressings/:id` - Détails pressing (DISPONIBLE)
- ✅ `GET /api/v1/pressings/:id/services` - Services pressing (DISPONIBLE)
- ❌ `GET /api/v1/pressings/:id/reviews` - Avis clients (MANQUANT)
- ❌ `POST /api/v1/pressings/:id/reviews` - Ajouter avis (MANQUANT)
- ❌ `GET /api/v1/pressings/:id/availability` - Créneaux disponibles (MANQUANT)

### 📦 **OrdersPage.tsx**
**Fonctionnalités** : Liste commandes, filtres, statuts, recherche
**Endpoints nécessaires** :
- ✅ `GET /api/v1/orders` - Liste commandes avec pagination (DISPONIBLE)
- ✅ `PATCH /api/v1/orders/:id/status` - Mettre à jour statut (DISPONIBLE)
- ✅ `PUT /api/v1/orders/:id/cancel` - Annuler commande (DISPONIBLE)

### 🛒 **OrderCreatePage.tsx**
**Fonctionnalités** : Création commande step-by-step, calcul prix, validation
**Endpoints nécessaires** :
- ✅ `POST /api/v1/orders` - Créer commande (DISPONIBLE)
- ✅ `GET /api/v1/pressings/:id/services` - Services pour calcul prix (DISPONIBLE)
- ❌ `POST /api/v1/orders/estimate` - Estimation prix avant création (MANQUANT)
- ❌ `GET /api/v1/pressings/:id/delivery-zones` - Zones de livraison (MANQUANT)

### 📋 **OrderDetailPage.tsx**
**Fonctionnalités** : Détail commande, suivi, historique, actions
**Endpoints nécessaires** :
- ✅ `GET /api/v1/orders/:id` - Détail commande (DISPONIBLE)
- ✅ `POST /api/v1/orders/:id/review` - Noter commande (DISPONIBLE)
- ❌ `GET /api/v1/orders/:id/tracking` - Suivi temps réel (MANQUANT - WebSocket)
- ❌ `POST /api/v1/orders/:id/support` - Contacter support (MANQUANT)

### 📍 **OrderTrackingPage.tsx**
**Fonctionnalités** : Suivi temps réel, carte, notifications
**Endpoints nécessaires** :
- ❌ `GET /api/v1/orders/:id/tracking` - Position temps réel (MANQUANT)
- ❌ `WebSocket /ws/orders/:id/tracking` - Suivi temps réel (MANQUANT)
- ❌ `GET /api/v1/orders/:id/delivery-route` - Itinéraire livraison (MANQUANT)

### 👤 **ProfilePage.tsx**
**Fonctionnalités** : Profil utilisateur, modification infos, sécurité
**Endpoints nécessaires** :
- ✅ `GET /api/v1/users/me` - Profil utilisateur (DISPONIBLE)
- ✅ `PUT /api/v1/users/me` - Modifier profil (DISPONIBLE)
- ✅ `PUT /api/v1/users/update-password` - Changer mot de passe (DISPONIBLE)
- ❌ `POST /api/v1/users/upload-avatar` - Upload photo profil (MANQUANT)

### 📍 **AddressesPage.tsx**
**Fonctionnalités** : Gestion adresses, géolocalisation, validation
**Endpoints nécessaires** :
- ❌ `GET /api/v1/users/addresses` - Liste adresses utilisateur (MANQUANT)
- ❌ `POST /api/v1/users/addresses` - Ajouter adresse (MANQUANT)
- ❌ `PUT /api/v1/users/addresses/:id` - Modifier adresse (MANQUANT)
- ❌ `DELETE /api/v1/users/addresses/:id` - Supprimer adresse (MANQUANT)
- ❌ `POST /api/v1/addresses/validate` - Valider adresse (MANQUANT)

### 💳 **PaymentPage.tsx**
**Fonctionnalités** : Processus paiement Mobile Money, validation
**Endpoints nécessaires** :
- ✅ `POST /api/v1/payments/initiate` - Initier paiement (DISPONIBLE)
- ✅ `GET /api/v1/payments/:id/status` - Statut paiement (DISPONIBLE)
- ✅ `POST /api/v1/payments/verify` - Vérifier paiement (DISPONIBLE)
- ✅ `GET /api/v1/payments/methods` - Méthodes disponibles (DISPONIBLE)

### 💳 **PaymentMethodsPage.tsx**
**Fonctionnalités** : Gestion méthodes paiement, cartes sauvegardées
**Endpoints nécessaires** :
- ✅ `GET /api/v1/payments/methods` - Méthodes disponibles (DISPONIBLE)
- ❌ `GET /api/v1/users/payment-methods` - Méthodes sauvegardées (MANQUANT)
- ❌ `POST /api/v1/users/payment-methods` - Ajouter méthode (MANQUANT)
- ❌ `DELETE /api/v1/users/payment-methods/:id` - Supprimer méthode (MANQUANT)

### 📊 **TransactionHistoryPage.tsx**
**Fonctionnalités** : Historique transactions, filtres, statistiques
**Endpoints nécessaires** :
- ✅ `GET /api/v1/transactions` - Historique avec stats (DISPONIBLE)
- ✅ `GET /api/v1/transactions/:id` - Détail transaction (DISPONIBLE)
- ✅ `GET /api/v1/payments` - Historique paiements (DISPONIBLE)

### ⚙️ **SettingsPage.tsx**
**Fonctionnalités** : Paramètres app, notifications, préférences
**Endpoints nécessaires** :
- ✅ `GET /api/v1/users/me` - Paramètres utilisateur (DISPONIBLE)
- ✅ `PUT /api/v1/users/me` - Modifier paramètres (DISPONIBLE)
- ❌ `GET/PUT /api/v1/users/notifications` - Préférences notifications (MANQUANT)
- ❌ `GET/PUT /api/v1/users/preferences` - Préférences app (MANQUANT)

### 🔔 **NotificationsPage.tsx**
**Fonctionnalités** : Liste notifications, marquer lues, préférences
**Endpoints nécessaires** :
- ❌ `GET /api/v1/notifications` - Liste notifications (MANQUANT)
- ❌ `PUT /api/v1/notifications/:id/read` - Marquer comme lue (MANQUANT)
- ❌ `PUT /api/v1/notifications/read-all` - Tout marquer lu (MANQUANT)
- ❌ `DELETE /api/v1/notifications/:id` - Supprimer notification (MANQUANT)

### 🏠 **ClientDashboardPage.tsx**
**Fonctionnalités** : Vue d'ensemble, stats, commandes récentes, actions rapides
**Endpoints nécessaires** :
- ✅ `GET /api/v1/orders` - Commandes récentes (DISPONIBLE)
- ✅ `GET /api/v1/users/me` - Infos utilisateur (DISPONIBLE)
- ❌ `GET /api/v1/dashboard/stats` - Statistiques dashboard (MANQUANT)
- ❌ `GET /api/v1/notifications/unread` - Notifications non lues (MANQUANT)

## 📊 RÉSUMÉ ENDPOINTS

### ✅ **ENDPOINTS DISPONIBLES (15/34)** :
- **Authentification** : login, register, me, update-password
- **Commandes** : CRUD complet, statuts, annulation, notation
- **Pressings** : liste, détails, services, géolocalisation
- **Paiements** : initiation, vérification, historique, méthodes
- **Utilisateurs** : profil, modification

### ❌ **ENDPOINTS MANQUANTS (19/34)** :
- **Favoris** : gestion pressings favoris
- **Adresses** : CRUD adresses utilisateur
- **Avis** : système d'avis clients
- **Notifications** : système notifications push
- **Suivi temps réel** : WebSocket tracking
- **Créneaux** : disponibilités pressings
- **Support** : système support intégré
- **Statistiques** : dashboard et analytics
- **Préférences** : paramètres utilisateur avancés

## 🎯 PRIORITÉS D'IMPLÉMENTATION

### **PHASE 1 - CRITIQUE** :
1. `GET/POST/DELETE /api/v1/users/favorites` - Favoris pressings
2. `GET/POST/PUT/DELETE /api/v1/users/addresses` - Gestion adresses
3. `GET /api/v1/notifications` - Système notifications
4. `GET /api/v1/dashboard/stats` - Statistiques dashboard

### **PHASE 2 - IMPORTANT** :
1. `GET/POST /api/v1/pressings/:id/reviews` - Système d'avis
2. `GET /api/v1/pressings/:id/availability` - Créneaux disponibles
3. `WebSocket /ws/orders/:id/tracking` - Suivi temps réel
4. `GET/PUT /api/v1/users/preferences` - Préférences utilisateur

### **PHASE 3 - AMÉLIORATIONS** :
1. `POST /api/v1/orders/estimate` - Estimation prix
2. `GET /api/v1/pressings/popular` - Pressings populaires
3. `POST /api/v1/users/upload-avatar` - Upload photos
4. `GET/POST/DELETE /api/v1/users/payment-methods` - Méthodes sauvegardées

## 🔧 ACTIONS IMMÉDIATES

1. **Adapter API Service Frontend** : Ajouter les endpoints disponibles manquants
2. **Créer Endpoints Backend Critiques** : Favoris, adresses, notifications
3. **Intégrer Pages Existantes** : Utiliser endpoints disponibles
4. **Tester Intégration** : Valider communication frontend-backend
