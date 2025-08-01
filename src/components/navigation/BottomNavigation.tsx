import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const BottomNavigation: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Navigation optimisée pour clients (5 pages principales)
  const clientNavItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/client/search', label: 'Rechercher', icon: '🔍' },
    { path: '/client/orders', label: 'Commandes', icon: '📦', badge: '3' },
    { path: '/client/pressing', label: 'Pressings', icon: '🏪' },
    { path: '/client/profile', label: 'Profil', icon: '👤' }
  ];

  // Navigation optimisée pour pressing (5 pages principales)
  const pressingNavItems = [
    { path: '/pressing/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/pressing/orders', label: 'Commandes', icon: '📋', badge: '12' },
    { path: '/pressing/services', label: 'Services', icon: '👔' },
    { path: '/pressing/earnings', label: 'Revenus', icon: '💰' },
    { path: '/pressing/analytics', label: 'Stats', icon: '📈' }
  ];

  // Navigation optimisée pour admin (5 pages principales)
  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥', badge: '156' },
    { path: '/admin/pressings', label: 'Pressings', icon: '🏪', badge: '23' },
    { path: '/admin/payments', label: 'Paiements', icon: '💳' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' }
  ];

  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { path: '/', label: 'Accueil', icon: '🏠' },
        { path: '/search', label: 'Rechercher', icon: '🔍' },
        { path: '/login', label: 'Connexion', icon: '🔑' },
        { path: '/register-client', label: 'S\'inscrire', icon: '✨' }
      ];
    }
    
    switch (user?.role?.toLowerCase()) {
      case 'pressing':
        return pressingNavItems;
      case 'admin':
        return adminNavItems; // Admin a maintenant une bottom nav mobile
      case 'client':
      default:
        return clientNavItems;
    }
  };

  const navItems = getNavItems();

  // Toujours afficher la bottom nav sur mobile
  if (!navItems.length) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center space-y-1 relative transition-colors ${
              isActive(item.path)
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <span className="text-lg">{item.icon}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium truncate w-full text-center">
              {item.label}
            </span>
            {isActive(item.path) && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
