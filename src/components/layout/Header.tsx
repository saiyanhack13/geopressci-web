import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  // Navigation publique
  const publicNavItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/search', label: 'Rechercher Pressings', icon: '🔍' }
  ];

  // Navigation selon le rôle utilisateur
  const getAuthenticatedNavItems = () => {
    switch (user?.role?.toLowerCase()) {
      case 'client':
        return [
          { path: '/client/dashboard', label: 'Mon Espace', icon: '📊' },
          { path: '/client/orders', label: 'Mes Commandes', icon: '📦' },
          { path: '/client/search', label: 'Rechercher', icon: '🔍' },
          { path: '/client/pressing', label: 'Tous les Pressings', icon: '🏪' }
        ];
      case 'pressing':
        return [
          { path: '/pressing/dashboard', label: 'Tableau de Bord', icon: '📊' },
          { path: '/pressing/orders', label: 'Gestion Commandes', icon: '📋' },
          { path: '/pressing/services', label: 'Services', icon: '👔' },
          { path: '/pressing/earnings', label: 'Revenus', icon: '💰' }
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Administration', icon: '👑' },
          { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
          { path: '/admin/pressings', label: 'Pressings', icon: '🏪' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📈' }
        ];
      default:
        return [];
    }
  };

  const navItems = isAuthenticated ? getAuthenticatedNavItems() : publicNavItems;

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
              <div className="text-2xl">🧺</div>
              <span className="text-xl font-bold hidden sm:block">GeoPressci</span>
              <span className="text-lg font-bold sm:hidden">GP</span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Profil utilisateur */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role === 'pressing' ? 'Pressing' : user?.role === 'admin' ? 'Admin' : 'Client'}
                    </p>
                  </div>
                </div>

                {/* Bouton profil/paramètres */}
                <Link
                  to={user?.role === 'pressing' ? '/pressing/profile' : user?.role === 'admin' ? '/admin/settings' : '/client/profile'}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Profil"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>

                {/* Bouton déconnexion */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Déconnexion"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register-client"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  S'inscrire
                </Link>
                <Link
                  to="/register-pressing"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors font-medium text-sm"
                >
                  Pressing
                </Link>
              </div>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isAuthenticated && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link
                    to={user?.role === 'pressing' ? '/pressing/profile' : user?.role === 'admin' ? '/admin/settings' : '/client/profile'}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base">👤</span>
                    <span>Mon Profil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="text-base">🚪</span>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
