import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface QuickLink {
  title: string;
  description: string;
  path: string;
  icon: string;
  color: string;
  badge?: string;
}

interface QuickLinksProps {
  title?: string;
  className?: string;
  maxItems?: number;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ 
  title = "Liens Rapides", 
  className = "",
  maxItems = 6 
}) => {
  const { user } = useAuth();

  // Liens rapides selon le rôle utilisateur
  const getQuickLinks = (): QuickLink[] => {
    switch (user?.role?.toLowerCase()) {
      case 'client':
        return [
          {
            title: 'Nouvelle Commande',
            description: 'Créer une nouvelle commande de pressing',
            path: '/client/orders/create',
            icon: '➕',
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            title: 'Mes Commandes',
            description: 'Voir toutes mes commandes en cours',
            path: '/client/orders',
            icon: '📦',
            color: 'bg-blue-500 hover:bg-blue-600',
            badge: '3'
          },
          {
            title: 'Rechercher Pressings',
            description: 'Trouver des pressings près de moi',
            path: '/client/search',
            icon: '🔍',
            color: 'bg-purple-500 hover:bg-purple-600'
          },
          {
            title: 'Tous les Pressings',
            description: 'Explorer tous les pressings disponibles',
            path: '/client/pressing',
            icon: '🏪',
            color: 'bg-orange-500 hover:bg-orange-600'
          },
          {
            title: 'Mes Favoris',
            description: 'Pressings que j\'ai mis en favoris',
            path: '/client/favorites',
            icon: '❤️',
            color: 'bg-red-500 hover:bg-red-600'
          },
          {
            title: 'Historique',
            description: 'Voir l\'historique de mes commandes',
            path: '/client/history',
            icon: '📋',
            color: 'bg-gray-500 hover:bg-gray-600'
          },
          {
            title: 'Effectuer un Paiement',
            description: 'Payer une commande en attente',
            path: '/client/payment',
            icon: '💳',
            color: 'bg-indigo-500 hover:bg-indigo-600'
          },
          {
            title: 'Mes Adresses',
            description: 'Gérer mes adresses de livraison',
            path: '/client/addresses',
            icon: '📍',
            color: 'bg-teal-500 hover:bg-teal-600'
          }
        ];

      case 'pressing':
        return [
          {
            title: 'Gestion Commandes',
            description: 'Gérer toutes les commandes reçues',
            path: '/pressing/orders',
            icon: '📋',
            color: 'bg-blue-500 hover:bg-blue-600',
            badge: '12'
          },
          {
            title: 'Services & Tarifs',
            description: 'Configurer mes services et prix',
            path: '/pressing/services',
            icon: '👔',
            color: 'bg-purple-500 hover:bg-purple-600'
          },
          {
            title: 'Planning',
            description: 'Gérer mon planning et créneaux',
            path: '/pressing/schedule',
            icon: '📅',
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            title: 'Revenus & Gains',
            description: 'Voir mes revenus et statistiques',
            path: '/pressing/earnings',
            icon: '💰',
            color: 'bg-yellow-500 hover:bg-yellow-600'
          },
          {
            title: 'Avis Clients',
            description: 'Gérer les avis et commentaires',
            path: '/pressing/reviews',
            icon: '⭐',
            color: 'bg-orange-500 hover:bg-orange-600'
          },
          {
            title: 'Statistiques',
            description: 'Analytics détaillées de performance',
            path: '/pressing/analytics',
            icon: '📈',
            color: 'bg-indigo-500 hover:bg-indigo-600'
          },
          {
            title: 'Galerie Photos',
            description: 'Gérer les photos de mon pressing',
            path: '/pressing/gallery',
            icon: '📸',
            color: 'bg-pink-500 hover:bg-pink-600'
          },
          {
            title: 'Profil Business',
            description: 'Modifier les informations de mon pressing',
            path: '/pressing/profile',
            icon: '🏪',
            color: 'bg-teal-500 hover:bg-teal-600'
          }
        ];

      case 'admin':
        return [
          {
            title: 'Gestion Utilisateurs',
            description: 'Gérer tous les utilisateurs de la plateforme',
            path: '/admin/users',
            icon: '👥',
            color: 'bg-blue-500 hover:bg-blue-600',
            badge: '156'
          },
          {
            title: 'Validation Pressings',
            description: 'Valider les nouveaux pressings',
            path: '/admin/pressings',
            icon: '🏪',
            color: 'bg-orange-500 hover:bg-orange-600',
            badge: '23'
          },
          {
            title: 'Supervision Commandes',
            description: 'Superviser toutes les commandes',
            path: '/admin/orders',
            icon: '📦',
            color: 'bg-purple-500 hover:bg-purple-600'
          },
          {
            title: 'Monitoring Paiements',
            description: 'Surveiller les transactions',
            path: '/admin/payments',
            icon: '💳',
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            title: 'Analytics Plateforme',
            description: 'Statistiques globales de la plateforme',
            path: '/admin/analytics',
            icon: '📈',
            color: 'bg-indigo-500 hover:bg-indigo-600'
          },
          {
            title: 'Logs d\'Activité',
            description: 'Consulter les logs système',
            path: '/admin/activity-logs',
            icon: '📝',
            color: 'bg-gray-500 hover:bg-gray-600'
          },
          {
            title: 'Configuration Système',
            description: 'Paramètres généraux de la plateforme',
            path: '/admin/settings',
            icon: '⚙️',
            color: 'bg-red-500 hover:bg-red-600'
          }
        ];

      default:
        return [
          {
            title: 'Rechercher Pressings',
            description: 'Trouver des pressings près de vous',
            path: '/search',
            icon: '🔍',
            color: 'bg-blue-500 hover:bg-blue-600'
          },
          {
            title: 'S\'inscrire Client',
            description: 'Créer un compte client',
            path: '/register-client',
            icon: '✨',
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            title: 'Inscrire mon Pressing',
            description: 'Rejoindre en tant que pressing',
            path: '/register-pressing',
            icon: '🏪',
            color: 'bg-orange-500 hover:bg-orange-600'
          },
          {
            title: 'Se Connecter',
            description: 'Accéder à mon compte',
            path: '/login',
            icon: '🔑',
            color: 'bg-purple-500 hover:bg-purple-600'
          }
        ];
    }
  };

  const quickLinks = getQuickLinks().slice(0, maxItems);

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">
          Accès rapide aux fonctionnalités principales
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${link.color} flex items-center justify-center text-white text-lg transition-colors`}>
                {link.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </h4>
                  {link.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {link.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {link.description}
                </p>
              </div>
            </div>

            {/* Flèche d'indication */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
