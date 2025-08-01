import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

  const isActive = (path: string) => location.pathname === path;

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Navigation complète pour clients (22 pages)
  const clientNavigation = [
    {
      section: 'main',
      title: 'Principal',
      icon: '🏠',
      items: [
        { path: '/', label: 'Accueil', icon: '🏠' },
        { path: '/client/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/client/search', label: 'Rechercher', icon: '🔍' },
        { path: '/client/pressing', label: 'Tous les Pressings', icon: '🏪' },
        { path: '/client/favorites', label: 'Favoris', icon: '❤️' }
      ]
    },
    {
      section: 'orders',
      title: 'Commandes & Suivi',
      icon: '📦',
      items: [
        { path: '/client/orders', label: 'Mes Commandes', icon: '📦', badge: '3' },
        { path: '/client/orders/create', label: 'Nouvelle Commande', icon: '➕' },
        { path: '/client/history', label: 'Historique Complet', icon: '📋' }
      ]
    },
    {
      section: 'payments',
      title: 'Paiements & Transactions',
      icon: '💳',
      items: [
        { path: '/client/payment', label: 'Effectuer un Paiement', icon: '💳' },
        { path: '/client/payment-methods', label: 'Moyens de Paiement', icon: '🏦' },
        { path: '/client/transactions', label: 'Historique Transactions', icon: '💰' }
      ]
    },
    {
      section: 'profile',
      title: 'Profil & Paramètres',
      icon: '👤',
      items: [
        { path: '/client/profile', label: 'Mon Profil', icon: '👤' },
        { path: '/client/addresses', label: 'Mes Adresses', icon: '📍' },
        { path: '/client/notifications', label: 'Notifications', icon: '🔔' },
        { path: '/client/settings', label: 'Paramètres', icon: '⚙️' }
      ]
    }
  ];

  // Navigation complète pour pressing (13 pages)
  const pressingNavigation = [
    {
      section: 'main',
      title: 'Gestion Principale',
      icon: '📊',
      items: [
        { path: '/pressing/dashboard', label: 'Tableau de Bord', icon: '📊' },
        { path: '/pressing/orders', label: 'Gestion Commandes', icon: '📋', badge: '12' },
        { path: '/pressing/services', label: 'Services & Tarifs', icon: '👔' },
        { path: '/pressing/schedule', label: 'Planning & Créneaux', icon: '📅' }
      ]
    },
    {
      section: 'business',
      title: 'Business & Performance',
      icon: '💼',
      items: [
        { path: '/pressing/earnings', label: 'Revenus & Gains', icon: '💰' },
        { path: '/pressing/analytics', label: 'Statistiques Détaillées', icon: '📈' },
        { path: '/pressing/reviews', label: 'Avis & Commentaires', icon: '⭐' },
        { path: '/pressing/gallery', label: 'Galerie Photos', icon: '📸' }
      ]
    },
    {
      section: 'settings',
      title: 'Configuration & Profil',
      icon: '⚙️',
      items: [
        { path: '/pressing/profile', label: 'Profil Business', icon: '🏪' },
        { path: '/pressing/settings', label: 'Paramètres Généraux', icon: '⚙️' },
        { path: '/pressing/location', label: 'Localisation & Zone', icon: '📍' },
        { path: '/pressing/subscription', label: 'Abonnement & Facturation', icon: '💎' }
      ]
    },
    {
      section: 'support',
      title: 'Aide & Support',
      icon: '❓',
      items: [
        { path: '/pressing/support', label: 'Centre d\'Aide', icon: '🆘' }
      ]
    }
  ];

  // Navigation complète pour admin (8 pages)
  const adminNavigation = [
    {
      section: 'main',
      title: 'Administration Générale',
      icon: '👑',
      items: [
        { path: '/admin/dashboard', label: 'Tableau de Bord Admin', icon: '📊' },
        { path: '/admin/users', label: 'Gestion Utilisateurs', icon: '👥', badge: '156' },
        { path: '/admin/pressings', label: 'Validation Pressings', icon: '🏪', badge: '23' },
        { path: '/admin/orders', label: 'Supervision Commandes', icon: '📦' }
      ]
    },
    {
      section: 'finance',
      title: 'Finances & Monitoring',
      icon: '💰',
      items: [
        { path: '/admin/payments', label: 'Monitoring Paiements', icon: '💳' },
        { path: '/admin/analytics', label: 'Analytics Plateforme', icon: '📈' }
      ]
    },
    {
      section: 'system',
      title: 'Système & Sécurité',
      icon: '🔧',
      items: [
        { path: '/admin/activity-logs', label: 'Logs d\'Activité', icon: '📝' },
        { path: '/admin/settings', label: 'Configuration Système', icon: '⚙️' }
      ]
    }
  ];

  const getNavigation = () => {
    switch (user?.role?.toLowerCase()) {
      case 'pressing':
        return pressingNavigation;
      case 'admin':
        return adminNavigation;
      case 'client':
      default:
        return clientNavigation;
    }
  };

  const getRoleInfo = () => {
    switch (user?.role?.toLowerCase()) {
      case 'pressing':
        return {
          title: 'Espace Pressing',
          subtitle: 'Gestion de votre pressing',
          icon: '🏪',
          color: 'bg-orange-500'
        };
      case 'admin':
        return {
          title: 'Administration',
          subtitle: 'Gestion de la plateforme',
          icon: '👑',
          color: 'bg-red-500'
        };
      case 'client':
      default:
        return {
          title: 'Espace Client',
          subtitle: 'Vos services de pressing',
          icon: '👤',
          color: 'bg-blue-500'
        };
    }
  };

  const navigation = getNavigation();
  const roleInfo = getRoleInfo();

  if (!user || (user.role !== 'pressing' && user.role !== 'admin' && user.role !== 'client')) {
    return null;
  }

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🧺</div>
            <span className="text-lg font-bold text-blue-600">GeoPressci</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'pressing' ? 'Pressing' : 'Administrateur'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-2">
            {navigation.map((section) => (
              <div key={section.section}>
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedSections.includes(section.section) ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {expandedSections.includes(section.section) && (
                  <div className="space-y-1 ml-4">
                    {section.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-4 py-2 text-sm rounded-md transition-colors ${
                          isActive(item.path)
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            GeoPressci v1.0
            <br />
            © 2024 - Abidjan, CI
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
