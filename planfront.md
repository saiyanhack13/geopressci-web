# Plan de Développement Front-End - Geopressci

Ce document détaille l'architecture, les fonctionnalités et les axes de développement de l'application web Geopressci. Il est basé sur une analyse complète du code source existant.

## 1. Synthèse du Projet

Geopressci est une application web complète de mise en relation entre des clients et des services de pressing en Côte d'Ivoire, avec un focus particulier sur Abidjan. L'application est divisée en trois interfaces distinctes :

-   **Interface Client** : Permet de chercher, commander et suivre des services de pressing.
-   **Interface Pressing** : Un tableau de bord pour les partenaires afin de gérer leur activité.
-   **Interface Admin** : Un back-office pour la supervision et la gestion de la plateforme.

L'application intègre des fonctionnalités spécifiques au marché ivoirien (Mobile Money, quartiers d'Abidjan, design localisé).

## 2. Architecture Générale

Le projet est structuré de manière modulaire et scalable, en suivant les meilleures pratiques de développement React.

-   **Framework** : React avec TypeScript
-   **Routing** : `react-router-dom`
-   **State Management** : Redux Toolkit (`/src/store`)
-   **Styling** : CSS/UI-Kit (probablement un kit comme Shadcn/UI basé sur les composants dans `/src/components/ui`)
-   **Structure des dossiers** :
    -   `/src/pages` : Contient les vues de l'application, organisées par rôle (client, pressing, admin, auth).
    -   `/src/components` : Composants réutilisables, organisés par fonctionnalité (auth, search, order, ui, etc.).
    -   `/src/hooks` : Hooks personnalisés pour la logique réutilisable.
    -   `/src/store` : Configuration du store Redux, des slices et des API (RTK Query).
    -   `/src/services` : Logique d'appel aux API.
    -   `/src/types` : Définitions des types TypeScript.

## 3. Analyse des Fonctionnalités Implémentées

L'application dispose d'une base fonctionnelle très solide pour chaque rôle.

### 3.1. Interface Client (`/pages/client`)

Le parcours client est complet, de la recherche au suivi post-paiement.

-   `HomePage.tsx` : Page d'accueil avec recherche.
-   `SearchPage.tsx` : Recherche avancée de pressings.
-   `PressingDetailPage.tsx` : Fiche détaillée d'un pressing.
-   `OrderCreatePage.tsx` : Processus de création de commande.
-   `OrdersPage.tsx` : Historique des commandes.
-   `OrderDetailPage.tsx` : Détail d'une commande spécifique.
-   `OrderTrackingPage.tsx` : Suivi en temps réel.
-   **Gestion de Paiement** : `PaymentPage`, `PaymentSuccessPage`, `PaymentFailedPage`, `PaymentPendingPage`.
-   **Gestion de Profil** : `ProfilePage`, `AddressesPage`, `PaymentMethodsPage`, `NotificationsPage`, `FavoritesPage`, `HistoryPage`, `SettingsPage`.

### 3.2. Interface Pressing (`/pages/pressing`)

Le tableau de bord partenaire est riche en fonctionnalités de gestion.

-   `DashboardPage.tsx` : Vue d'ensemble des KPIs.
-   `OrdersManagementPage.tsx` : Gestion des commandes reçues.
-   `ServicesPage.tsx` & `SchedulePage.tsx` : Gestion des services, tarifs et horaires.
-   `EarningsPage.tsx` & `AnalyticsPage.tsx` : Suivi des revenus et statistiques.
-   `BusinessProfilePage.tsx` & `ProfileSettingsPage.tsx` : Gestion du profil public et des paramètres.
-   `ReviewsPage.tsx` : Gestion des avis clients.
-   `GalleryPage.tsx` & `LocationPage.tsx` : Gestion des photos et de la zone de service.
-   `SubscriptionPage.tsx` : Gestion de l'abonnement à la plateforme.
-   `SupportPage.tsx` : Centre d'aide.

### 3.3. Interface Admin (`/pages/admin`)

L'interface d'administration permet une supervision complète de la plateforme.

-   `AdminDashboardPage.tsx` : Tableau de bord principal avec les métriques clés.
-   `UsersManagementPage.tsx` : Gestion des utilisateurs (clients et pressings).
-   `PressingsManagementPage.tsx` : Validation et gestion des partenaires.
-   `OrdersOverviewPage.tsx` : Supervision de toutes les commandes.
-   `PaymentsPage.tsx` : Suivi des transactions financières.
-   `AnalyticsPage.tsx` : Analyses et rapports détaillés.
-   `SettingsPage.tsx` : Configuration globale de l'application.
-   `ActivityLogsPage.tsx` : Logs d'activité pour l'audit.

### 3.4. Authentification (`/pages/auth`)

Le flux d'authentification est complet et sécurisé.

-   `LoginPage.tsx` : Connexion.
-   `RegisterClientPage.tsx` & `RegisterPressingPage.tsx` : Inscriptions distinctes.
-   `ForgotPasswordPage.tsx` & `ResetPasswordPage.tsx` : Récupération de mot de passe.
-   `VerifyEmailPage.tsx` : Vérification de l'adresse e-mail.

## 4. Prochaines Étapes et Axes d'Amélioration

Basé sur l'analyse et les mémoires, voici une feuille de route suggérée :

### 4.1. Finalisation des Fonctionnalités

-   **Finaliser la `SearchPage`** : Implémenter les filtres avancés décrits dans la mémoire (distance, note, prix, services, horaires, etc.) et la vue carte/liste.
-   **Compléter les pages `pressing`** : S'assurer que les pages `ProfileSettingsPage`, `ServicesPage`, `SchedulePage`, et `ReviewsPage` sont pleinement fonctionnelles comme indiqué dans la mémoire `74c291e3-52cf-49b1-9a70-58f20073c6aa`.
-   **Intégrer le Tracking Temps Réel** : Connecter le `useOrderTracking` hook à l'`OrderTrackingPage` et à la `OrdersPage` pour des mises à jour en direct.

### 4.2. Tests et Qualité

-   **Tests Unitaires** : Mettre en place des tests avec Jest et React Testing Library pour les composants critiques (ex: `SubmitButton`, `FormField`) et les hooks.
-   **Tests d'Intégration** : Tester les flux utilisateurs complets (inscription, commande, paiement).
-   **Tests End-to-End (E2E)** : Utiliser Cypress ou Playwright pour simuler des parcours utilisateurs réels dans un navigateur.

### 4.3. Optimisations de Performance

-   **Lazy Loading** : Implémenter le chargement différé des pages avec `React.lazy` et `Suspense` pour réduire le temps de chargement initial.
-   **Optimisation des Bundles** : Analyser la taille des bundles avec `webpack-bundle-analyzer` et optimiser les imports.
-   **Mise en Cache Stratégique** : Affiner les stratégies de cache de RTK Query pour minimiser les appels réseau redondants.

### 4.4. Déploiement et CI/CD

-   **Mettre en place un pipeline de CI/CD** (ex: GitHub Actions, GitLab CI) pour automatiser les tests, le build et le déploiement sur des environnements de staging et de production.

Ce plan fournit une base solide pour guider les futurs développements de Geopressci. Il devra être mis à jour régulièrement pour refléter l'avancement du projet.

## 5. Points d'API du Backend

Voici la liste des endpoints backend identifiés depuis le code source du front-end. Elle peut servir de base pour les améliorations et la documentation de l'API.

### Authentification
-   `POST /auth/login`
-   `POST /auth/register`
-   `POST /auth/forgot-password`
-   `POST /auth/reset-password/{token}`
-   `POST /auth/resend-verification-email`

### Pressings
-   `GET /pressings`
-   `GET /pressings/nearby`
-   `GET /pressings/{id}`

### Commandes (Orders)
-   `GET /orders` (avec filtres: `userId`, `status`, `page`, `limit`, `search`)
-   `GET /orders/{id}`
-   `POST /orders`
-   `PATCH /orders/{id}/status`

### Paiements (Payments)
-   `GET /payments`
-   `POST /payments/initiate`

### Géolocalisation (Maps)
-   `GET /maps/reverse-geocode`

### Endpoints à Définir ou Implémenter (Suggestions)

Basé sur les fonctionnalités de l'interface (notamment admin), les endpoints suivants sont probablement nécessaires :

#### Gestion des Utilisateurs (Admin)
-   `GET /admin/users`
-   `GET /admin/users/{id}`
-   `PUT /admin/users/{id}`
-   `DELETE /admin/users/{id}`
-   `PATCH /admin/users/{id}/status` (ex: bannir/activer)

#### Gestion des Pressings (Admin)
-   `GET /admin/pressings`
-   `PATCH /admin/pressings/{id}/status` (ex: approuver/rejeter)

#### Gestion des Abonnements (Pressing & Admin)
-   `GET /subscriptions/plans`
-   `POST /subscriptions/subscribe`
-   `GET /users/{userId}/subscription`