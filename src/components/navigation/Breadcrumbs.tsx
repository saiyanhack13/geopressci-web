import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Mapping complet des routes vers des labels lisibles par rôle
  const getRouteLabels = (): Record<string, string> => {
    const baseLabels = {
      // Routes publiques
      '': 'Accueil',
      'search': 'Rechercher',
      'login': 'Connexion',
      'register-client': 'Inscription Client',
      'register-pressing': 'Inscription Pressing',
      'forgot-password': 'Mot de passe oublié',
      'reset-password': 'Réinitialiser mot de passe',
      
      // Routes communes
      'dashboard': 'Tableau de bord',
      'orders': 'Commandes',
      'profile': 'Profil',
      'settings': 'Paramètres',
      'notifications': 'Notifications',
      'analytics': 'Statistiques',
      'support': 'Support'
    };

    const roleSpecificLabels: Record<string, Record<string, string>> = {
      client: {
        'client': 'Espace Client',
        'search': 'Rechercher Pressings',
        'orders': 'Mes Commandes',
        'create': 'Nouvelle Commande',
        'history': 'Historique Commandes',
        'favorites': 'Pressings Favoris',
        'addresses': 'Mes Adresses',
        'payment-methods': 'Moyens de Paiement',
        'payment': 'Paiement',
        'success': 'Paiement Réussi',
        'failed': 'Paiement Échoué',
        'pending': 'Paiement en Attente',
        'transactions': 'Historique Transactions',
        'track': 'Suivi Commande',
        'tracking': 'Suivi en Temps Réel'
      },
      pressing: {
        'pressing': 'Espace Pressing',
        'dashboard': 'Tableau de Bord Business',
        'orders': 'Gestion Commandes',
        'services': 'Gestion Services',
        'schedule': 'Planning & Créneaux',
        'earnings': 'Revenus & Finances',
        'reviews': 'Avis Clients',
        'gallery': 'Galerie Photos',
        'location': 'Localisation & Zone',
        'subscription': 'Abonnement Premium',
        'analytics': 'Statistiques Business',
        'support': 'Support Pressing',
        'profile': 'Profil Business'
      },
      admin: {
        'admin': 'Administration',
        'dashboard': 'Dashboard Admin',
        'users': 'Gestion Utilisateurs',
        'pressings': 'Gestion Pressings',
        'orders': 'Supervision Commandes',
        'payments': 'Monitoring Paiements',
        'analytics': 'Analytics Globales',
        'activity-logs': 'Logs d\'Activité',
        'settings': 'Paramètres Système'
      }
    };

    const currentRole = user?.role?.toLowerCase() || 'client';
    return {
      ...baseLabels,
      ...roleSpecificLabels[currentRole]
    };
  };

  const routeLabels = getRouteLabels();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    const currentRole = user?.role?.toLowerCase();

    // Page d'accueil spéciale
    if (pathSegments.length === 0) {
      return [{
        label: 'Accueil GeoPressci',
        icon: '🧺'
      }];
    }

    // Ajouter le breadcrumb racine selon le rôle
    const getRootBreadcrumb = () => {
      switch (currentRole) {
        case 'pressing':
          return {
            label: 'Espace Pressing',
            path: '/pressing/dashboard',
            icon: '🏪'
          };
        case 'admin':
          return {
            label: 'Administration',
            path: '/admin/dashboard',
            icon: '👑'
          };
        case 'client':
        default:
          return {
            label: 'Accueil',
            path: '/',
            icon: '🏠'
          };
      }
    };

    // Ajouter le breadcrumb racine si on n'est pas déjà dessus
    if (pathSegments.length > 0) {
      const rootBreadcrumb = getRootBreadcrumb();
      if (location.pathname !== rootBreadcrumb.path) {
        breadcrumbs.push(rootBreadcrumb);
      }
    }

    // Construire le chemin progressivement
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === pathSegments.length - 1;
      
      // Icônes contextuelles améliorées par rôle
      const getIcon = (seg: string): string => {
        const iconMap: Record<string, string> = {
          // Icônes communes
          'dashboard': '📊',
          'orders': '📦',
          'profile': '👤',
          'settings': '⚙️',
          'notifications': '🔔',
          'analytics': '📈',
          'support': '🆘',
          
          // Icônes client
          'search': '🔍',
          'favorites': '❤️',
          'history': '📋',
          'addresses': '📍',
          'payment': '💳',
          'payment-methods': '💳',
          'transactions': '💰',
          'create': '➕',
          'track': '🚚',
          'tracking': '📍',
          'success': '✅',
          'failed': '❌',
          'pending': '⏳',
          
          // Icônes pressing
          'services': '👔',
          'schedule': '📅',
          'earnings': '💰',
          'reviews': '⭐',
          'gallery': '📸',
          'location': '📍',
          'subscription': '💎',
          
          // Icônes admin
          'users': '👥',
          'pressings': '🏪',
          'payments': '💳',
          'activity-logs': '📝',
          
          // Icônes par rôle
          'client': '👤',
          'pressing': '🏪',
          'admin': '👑'
        };
        
        return iconMap[seg] || '';
      };
      
      const icon = getIcon(segment);
      
      // Ne pas dupliquer le segment racine
      if (!(index === 0 && (segment === 'client' || segment === 'pressing' || segment === 'admin'))) {
        // Gérer les IDs dynamiques
        if (segment.match(/^[0-9a-f-]+$/i)) {
          const parentSegment = pathSegments[index - 1];
          if (parentSegment === 'orders') {
            breadcrumbs.push({
              label: `Commande #${segment.slice(0, 8)}`,
              path: isLast ? undefined : currentPath,
              icon: '📦'
            });
          } else if (parentSegment === 'pressing') {
            breadcrumbs.push({
              label: 'Détails du pressing',
              path: isLast ? undefined : currentPath,
              icon: '🏪'
            });
          } else {
            breadcrumbs.push({
              label: `Détail #${segment.slice(0, 8)}`,
              path: isLast ? undefined : currentPath,
              icon: '📄'
            });
          }
        } else {
          breadcrumbs.push({
            label,
            path: isLast ? undefined : currentPath,
            icon
          });
        }
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Ne pas afficher si on est sur l'accueil ou si on a qu'un seul élément
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              
              {item.path ? (
                <Link
                  to={item.path}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="flex items-center space-x-1 text-gray-500 font-medium">
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
