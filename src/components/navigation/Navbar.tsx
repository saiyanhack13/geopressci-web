import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // Navigation complète pour clients (22 pages)
  const clientNavItems = [
    { 
      label: 'Principal', 
      items: [
        { path: '/', label: 'Accueil', icon: '🏠' },
        { path: '/client/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/client/search', label: 'Rechercher', icon: '🔍' },
        { path: '/client/favorites', label: 'Favoris', icon: '❤️' }
      ]
    },
    {
      label: 'Commandes',
      items: [
        { path: '/client/orders', label: 'Mes Commandes', icon: '📦' },
        { path: '/client/orders/create', label: 'Nouvelle Commande', icon: '➕' },
        { path: '/client/history', label: 'Historique', icon: '📋' }
      ]
    },
    {
      label: 'Profil',
      items: [
        { path: '/client/profile', label: 'Mon Profil', icon: '👤' },
        { path: '/client/addresses', label: 'Adresses', icon: '📍' },
        { path: '/client/payment-methods', label: 'Paiements', icon: '💳' },
        { path: '/client/notifications', label: 'Notifications', icon: '🔔' },
        { path: '/client/settings', label: 'Paramètres', icon: '⚙️' }
      ]
    }
  ];

  // Navigation complète pour pressing (13 pages)
  const pressingNavItems = [
    {
      label: 'Gestion',
      items: [
        { path: '/pressing/dashboard', label: 'Tableau de bord', icon: '📊' },
        { path: '/pressing/orders', label: 'Commandes', icon: '📋' },
        { path: '/pressing/services', label: 'Services', icon: '👔' },
        { path: '/pressing/schedule', label: 'Planning', icon: '📅' }
      ]
    },
    {
      label: 'Business',
      items: [
        { path: '/pressing/earnings', label: 'Revenus', icon: '💰' },
        { path: '/pressing/analytics', label: 'Statistiques', icon: '📈' },
        { path: '/pressing/reviews', label: 'Avis', icon: '⭐' },
        { path: '/pressing/gallery', label: 'Galerie', icon: '📸' }
      ]
    },
    {
      label: 'Configuration',
      items: [
        { path: '/pressing/profile', label: 'Profil Business', icon: '🏪' },
        { path: '/pressing/settings', label: 'Paramètres', icon: '⚙️' },
        { path: '/pressing/location', label: 'Localisation', icon: '📍' },
        { path: '/pressing/subscription', label: 'Abonnement', icon: '💎' },
        { path: '/pressing/support', label: 'Support', icon: '🆘' }
      ]
    }
  ];

  // Navigation complète pour admin (8 pages)
  const adminNavItems = [
    {
      label: 'Administration',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
        { path: '/admin/pressings', label: 'Pressings', icon: '🏪' },
        { path: '/admin/orders', label: 'Commandes', icon: '📦' }
      ]
    },
    {
      label: 'Finances & Analytics',
      items: [
        { path: '/admin/payments', label: 'Paiements', icon: '💳' },
        { path: '/admin/analytics', label: 'Statistiques', icon: '📈' }
      ]
    },
    {
      label: 'Système',
      items: [
        { path: '/admin/activity-logs', label: 'Logs', icon: '📝' },
        { path: '/admin/settings', label: 'Paramètres', icon: '⚙️' }
      ]
    }
  ];

  // Navigation simplifiée pour la barre principale
  const getMainNavItems = () => {
    if (!isAuthenticated) {
      return [
        { path: '/', label: 'Accueil', icon: '🏠' },
        { path: '/search', label: 'Rechercher', icon: '🔍' }
      ];
    }
    
    switch (user?.role?.toLowerCase()) {
      case 'pressing':
        return [
          { path: '/pressing/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/pressing/orders', label: 'Commandes', icon: '📋' },
          { path: '/pressing/services', label: 'Services', icon: '👔' },
          { path: '/pressing/earnings', label: 'Revenus', icon: '💰' }
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
          { path: '/admin/pressings', label: 'Pressings', icon: '🏪' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📈' }
        ];
      default: // client
        return [
          { path: '/', label: 'Accueil', icon: '🏠' },
          { path: '/client/search', label: 'Rechercher', icon: '🔍' },
          { path: '/client/orders', label: 'Commandes', icon: '📦' },
          { path: '/client/favorites', label: 'Favoris', icon: '❤️' }
        ];
    }
  };

  // Menu dropdown complet par rôle
  const getDropdownItems = () => {
    if (!isAuthenticated) return [];
    
    switch (user?.role?.toLowerCase()) {
      case 'pressing':
        return pressingNavItems;
      case 'admin':
        return adminNavItems;
      default: // client
        return clientNavItems;
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl">🧺</div>
            <span className="text-xl font-bold text-blue-600">GeoPressci</span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation principale */}
            {getMainNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Menu dropdown "Plus" pour toutes les pages */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  <span>⋯</span>
                  <span>Plus</span>
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      {getDropdownItems().map((section, sectionIndex) => (
                        <div key={section.label} className={sectionIndex > 0 ? 'border-t border-gray-100 pt-2' : ''}>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {section.label}
                          </div>
                          <div className="grid grid-cols-2 gap-1 px-2">
                            {section.items.map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsDropdownOpen(false)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                  isActive(item.path)
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <span className="text-base">{item.icon}</span>
                                <span className="truncate">{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Menu déroulant profil */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link
                      to={`/${user?.role}/profile`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      👤 Mon profil
                    </Link>
                    <Link
                      to={`/${user?.role}/settings`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      ⚙️ Paramètres
                    </Link>
                    {user?.role === 'client' && (
                      <Link
                        to="/client/notifications"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        🔔 Notifications
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Connexion
                </Link>
                <Link
                  to="/register-client"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {getMainNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
