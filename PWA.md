# PWA (Progressive Web App) - GeoPressCI

## 📱 Fonctionnalités PWA

GeoPressCI est maintenant une Progressive Web App complète qui peut être installée sur les appareils mobiles et desktop comme une application native.

### ✨ Fonctionnalités Principales

- **Installation sur l'écran d'accueil** : Ajoutez GeoPressCI directement sur votre écran d'accueil
- **Fonctionnement hors ligne** : Cache intelligent pour une utilisation sans connexion
- **Notifications push** : Recevez des notifications pour vos commandes
- **Expérience native** : Interface optimisée pour mobile et desktop
- **Synchronisation en arrière-plan** : Synchronise vos données automatiquement

## 🚀 Installation

### Sur iOS (iPhone/iPad)

1. Ouvrez GeoPressCI dans Safari
2. Appuyez sur le bouton "Partager" (carré avec flèche vers le haut)
3. Faites défiler vers le bas et appuyez sur "Sur l'écran d'accueil"
4. Appuyez sur "Ajouter" pour confirmer

### Sur Android

1. Ouvrez GeoPressCI dans Chrome
2. Une barre d'installation apparaîtra automatiquement
3. Appuyez sur "Installer" dans la barre
4. Ou utilisez le menu Chrome > "Installer l'application"

### Sur Desktop

1. Ouvrez GeoPressCI dans Chrome, Edge ou Firefox
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Ou utilisez le menu navigateur > "Installer GeoPressCI"

## 🛠️ Architecture Technique

### Service Worker (`public/sw.js`)

Le service worker gère :
- **Cache des ressources** : Stratégie cache-first pour les assets statiques
- **Cache des API** : Stratégie network-first avec fallback cache
- **Notifications push** : Gestion des notifications en arrière-plan
- **Synchronisation** : Sync des données quand la connexion revient

### Manifest (`public/manifest.json`)

Configuration PWA :
- **Métadonnées** : Nom, description, icônes
- **Affichage** : Mode standalone, orientation portrait
- **Raccourcis** : Actions rapides depuis l'écran d'accueil
- **Screenshots** : Aperçus pour les stores d'applications

### Composants React

- **PWAInstallPrompt** : Barre d'installation intelligente
- **PWAInstallButton** : Bouton d'installation réutilisable
- **usePWA** : Hook pour gérer l'état PWA

## 🎨 Interface Utilisateur

### Barre d'Installation

La barre d'installation apparaît automatiquement :
- **Délai** : 3 secondes après le chargement de la page
- **Conditions** : Uniquement si l'app n'est pas déjà installée
- **Persistance** : Se souvient si l'utilisateur a refusé
- **Responsive** : Adaptée mobile et desktop

### Indicateurs Visuels

- **Icônes** : Différentes selon la plateforme (iOS/Android)
- **Animations** : Slide-up smooth pour l'apparition
- **Couleurs** : Cohérentes avec le branding GeoPressCI

## 📊 Stratégies de Cache

### Cache-First (Ressources Statiques)
```
Cache → Network (fallback)
```
- Images, CSS, JavaScript
- Chargement instantané
- Économie de bande passante

### Network-First (API Calls)
```
Network → Cache (fallback)
```
- Données dynamiques
- Toujours à jour quand connecté
- Disponible hors ligne

### Stale-While-Revalidate (Pages)
```
Cache (immediate) + Network (background update)
```
- Pages HTML
- Chargement instantané
- Mise à jour en arrière-plan

## 🔔 Notifications Push

### Configuration

```javascript
// Demander la permission
await requestNotificationPermission();

// Afficher une notification
showNotification('Commande prête !', {
  body: 'Votre pressing est prêt à être récupéré',
  icon: '/logo192.png',
  actions: [
    { action: 'view', title: 'Voir' },
    { action: 'dismiss', title: 'Plus tard' }
  ]
});
```

### Types de Notifications

- **Commande confirmée** : Confirmation de prise en charge
- **Commande prête** : Pressing terminé
- **Livraison** : Coursier en route
- **Promotions** : Offres spéciales

## 📱 Raccourcis d'Application

Depuis l'écran d'accueil, accès rapide à :

1. **Nouvelle commande** : `/order`
   - Créer une nouvelle commande directement
   
2. **Mes commandes** : `/orders`
   - Voir l'historique et le statut

## 🔧 Configuration Développeur

### Variables d'Environnement

```bash
# Service Worker
REACT_APP_SW_ENABLED=true

# Notifications
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_key

# Debug PWA
REACT_APP_PWA_DEBUG=true
```

### Build Production

```bash
# Build avec PWA optimisée
npm run build

# Test PWA localement
npx serve -s build
```

### Audit PWA

```bash
# Lighthouse PWA audit
npx lighthouse http://localhost:3000 --view

# PWA Builder validation
https://www.pwabuilder.com/
```

## 📈 Métriques PWA

### Core Web Vitals

- **LCP** : < 2.5s (Largest Contentful Paint)
- **FID** : < 100ms (First Input Delay)
- **CLS** : < 0.1 (Cumulative Layout Shift)

### PWA Score

Objectif : **90+/100** sur Lighthouse PWA audit

### Critères d'Évaluation

- ✅ Installable
- ✅ Service Worker
- ✅ Manifest valide
- ✅ HTTPS
- ✅ Responsive
- ✅ Offline fallback

## 🚀 Déploiement

### Netlify

Configuration automatique PWA :
- Service Worker activé
- Manifest servi avec bon MIME type
- Headers de cache optimisés

### Vérifications Post-Déploiement

1. **Test d'installation** sur différents appareils
2. **Audit Lighthouse** PWA
3. **Test hors ligne** des fonctionnalités critiques
4. **Notifications** sur appareils réels

## 🔍 Debug et Troubleshooting

### Chrome DevTools

1. **Application** tab → Service Workers
2. **Application** tab → Manifest
3. **Network** tab → Offline simulation
4. **Console** → PWA logs

### Problèmes Courants

**Service Worker ne s'installe pas**
- Vérifier HTTPS
- Vérifier syntaxe SW
- Clear cache navigateur

**Manifest invalide**
- Valider sur https://manifest-validator.appspot.com/
- Vérifier chemins des icônes
- Vérifier format JSON

**Installation ne fonctionne pas**
- Vérifier critères PWA
- Tester sur différents navigateurs
- Vérifier permissions

## 📚 Ressources

- [PWA Documentation MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox (Google PWA Tools)](https://developers.google.com/web/tools/workbox)
- [PWA Builder (Microsoft)](https://www.pwabuilder.com/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)

---

**GeoPressCI PWA** - Une expérience mobile native pour votre service de pressing ! 📱✨
