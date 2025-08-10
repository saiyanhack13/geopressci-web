# Configuration API Frontend - GeoPressCI

## Vue d'ensemble

Le frontend GeoPressCI est maintenant configuré pour se connecter automatiquement au bon backend selon l'environnement :

- **Développement local** : `https://geopressci-akcdaadk.b4a.run//api/v1`
- **Production** : `https://geopressci-akcdaadk.b4a.run//api/v1`

## Fonctionnalités

### 🔄 Détection Automatique d'Environnement
- Détecte automatiquement si vous êtes en développement ou production
- Teste la disponibilité du backend local en développement
- Bascule automatiquement vers le backend de production si le local n'est pas disponible

### 🔧 Configuration Dynamique
- Configuration centralisée dans `src/config/api.config.ts`
- Support des variables d'environnement React
- Timeouts adaptés selon l'environnement

### 📊 Monitoring et Debug
- Hook `useApiConnection` pour surveiller l'état de la connexion
- Composant `ApiConnectionStatus` pour afficher le statut
- Panel de debug en développement (`ApiDebugPanel`)

## Fichiers Créés/Modifiés

### Nouveaux Fichiers
1. **`src/config/api.config.ts`** - Configuration centralisée de l'API
2. **`src/hooks/useApiConnection.ts`** - Hook pour gérer la connexion API
3. **`src/components/common/ApiConnectionStatus.tsx`** - Composant de statut
4. **`src/components/debug/ApiDebugPanel.tsx`** - Panel de debug
5. **`.env.example`** - Template des variables d'environnement

### Fichiers Modifiés
1. **`src/services/api.ts`** - Utilise maintenant la configuration dynamique
2. **`src/services/pressingApi.ts`** - Utilise maintenant la configuration dynamique

## Utilisation

### Configuration Automatique
```typescript
// La configuration se fait automatiquement
import { api } from '../services/api';

// L'API utilisera automatiquement la bonne URL
const { data } = api.useGetUserQuery();
```

### Hook de Connexion
```typescript
import { useApiConnection } from '../hooks/useApiConnection';

function MyComponent() {
  const { isConnected, config, error, retryConnection } = useApiConnection();
  
  if (!isConnected) {
    return <div>Connexion en cours...</div>;
  }
  
  return <div>Connecté à {config?.baseUrl}</div>;
}
```

### Composant de Statut
```typescript
import ApiConnectionStatus from '../components/common/ApiConnectionStatus';

function Header() {
  return (
    <div>
      <h1>Mon App</h1>
      <ApiConnectionStatus showDetails />
    </div>
  );
}
```

## Variables d'Environnement

Créez un fichier `.env.local` (ou `.env`) avec :

```bash
# URLs des APIs (optionnel, les valeurs par défaut sont définies)
REACT_APP_API_URL_DEV=https://geopressci-akcdaadk.b4a.run//api/v1
#REACT_APP_API_URL_PROD=https://geopressci-akcdaadk.b4a.run//api/v1

# Configuration de debug
REACT_APP_DEBUG_API=true
```

## Logique de Connexion

### En Développement
1. Teste d'abord `https://geopressci-akcdaadk.b4a.run//api/v1`
2. Si disponible → utilise le backend local
3. Si non disponible → bascule vers le backend de production
4. Affiche des messages de debug dans la console

### En Production
1. Utilise directement `https://geopressci-akcdaadk.b4a.run//api/v1`
2. Pas de test de connexion préalable
3. Timeout plus long pour les connexions réseau

## Debug et Monitoring

### Console Logs
- `🔍 Environnement détecté: development/production`
- `✅ Utilisation du backend local/production`
- `⚠️ Backend local non disponible, utilisation du backend de production`

### Panel de Debug (Développement uniquement)
- Affiche la configuration actuelle
- Teste tous les endpoints disponibles
- Permet de relancer les tests de connexion
- Visible uniquement en mode développement

### Composant de Statut
- Indicateur visuel de l'état de connexion
- Bouton de reconnexion en cas d'erreur
- Affichage de l'environnement utilisé

## Avantages

1. **Flexibilité** : Fonctionne en local et en production sans modification
2. **Robustesse** : Fallback automatique si le backend local est indisponible
3. **Debug** : Outils intégrés pour diagnostiquer les problèmes de connexion
4. **Performance** : Timeouts optimisés selon l'environnement
5. **Maintenance** : Configuration centralisée et facile à modifier

## Dépannage

### Backend Local Non Disponible
- Vérifiez que le backend tourne sur le port 5002
- Consultez les logs dans la console du navigateur
- Utilisez le panel de debug pour tester les connexions

### Erreurs CORS
- Vérifiez la configuration CORS du backend
- Assurez-vous que l'URL frontend est autorisée

### Timeouts
- Les timeouts sont configurés différemment selon l'environnement
- Développement : 10s, Production : 15s
- Modifiez dans `api.config.ts` si nécessaire
