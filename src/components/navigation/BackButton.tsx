import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath,
  label = 'Retour',
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getSmartFallback = (): string => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentRole = user?.role?.toLowerCase();
    
    // Fallbacks intelligents basés sur le contexte et le rôle
    
    // === GESTION DES COMMANDES ===
    if (pathSegments.includes('orders')) {
      // Suivi de commande → Détail commande
      if (pathSegments.includes('track') || pathSegments.includes('tracking')) {
        return `/${pathSegments[0]}/orders/${pathSegments[2] || ''}`;
      }
      // Détail commande → Liste commandes
      if (pathSegments.length > 2 && pathSegments[2] !== 'create') {
        return `/${pathSegments[0]}/orders`;
      }
      // Création commande → Dashboard ou recherche
      if (pathSegments.includes('create')) {
        return currentRole === 'client' ? '/client/search' : `/${pathSegments[0]}/dashboard`;
      }
    }
    
    // === GESTION DES PAIEMENTS ===
    if (pathSegments.includes('payment')) {
      // Résultat paiement → Commandes
      if (pathSegments.includes('success') || pathSegments.includes('failed') || pathSegments.includes('pending')) {
        return currentRole === 'client' ? '/client/orders' : '/admin/payments';
      }
      // Page paiement → Création commande
      return currentRole === 'client' ? '/client/orders/create' : '/admin/orders';
    }
    
    // === GESTION DU PROFIL ===
    if (pathSegments.includes('profile') || pathSegments.includes('settings')) {
      return `/${pathSegments[0]}/dashboard`;
    }
    
    // === GESTION DES ADRESSES ===
    if (pathSegments.includes('addresses')) {
      return '/client/profile';
    }
    
    // === GESTION DES MOYENS DE PAIEMENT ===
    if (pathSegments.includes('payment-methods') || pathSegments.includes('transactions')) {
      return '/client/profile';
    }
    
    // === GESTION DES NOTIFICATIONS ===
    if (pathSegments.includes('notifications')) {
      return `/${pathSegments[0]}/dashboard`;
    }
    
    // === GESTION PRESSING SPÉCIFIQUE ===
    if (currentRole === 'pressing') {
      if (pathSegments.includes('services') || pathSegments.includes('schedule')) {
        return '/pressing/dashboard';
      }
      if (pathSegments.includes('earnings') || pathSegments.includes('analytics')) {
        return '/pressing/dashboard';
      }
      if (pathSegments.includes('reviews') || pathSegments.includes('gallery')) {
        return '/pressing/dashboard';
      }
      if (pathSegments.includes('location') || pathSegments.includes('subscription')) {
        return '/pressing/settings';
      }
    }
    
    // === GESTION ADMIN SPÉCIFIQUE ===
    if (currentRole === 'admin') {
      if (pathSegments.includes('users') || pathSegments.includes('pressings')) {
        return '/admin/dashboard';
      }
      if (pathSegments.includes('payments') || pathSegments.includes('analytics')) {
        return '/admin/dashboard';
      }
      if (pathSegments.includes('activity-logs')) {
        return '/admin/settings';
      }
    }
    
    // === GESTION CLIENT SPÉCIFIQUE ===
    if (currentRole === 'client') {
      if (pathSegments.includes('search')) {
        return '/';
      }
      if (pathSegments.includes('favorites') || pathSegments.includes('history')) {
        return '/client/dashboard';
      }
    }
    
    // === FALLBACKS PAR RÔLE ===
    switch (currentRole) {
      case 'pressing':
        return '/pressing/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'client':
      default:
        return '/';
    }
  };

  const handleBack = () => {
    // Vérifier s'il y a un historique de navigation
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Utiliser le fallback intelligent
      const fallback = fallbackPath || getSmartFallback();
      navigate(fallback);
    }
  };

  const defaultClasses = "inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

  return (
    <button
      onClick={handleBack}
      className={className || defaultClasses}
      type="button"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
};

// Version compacte pour mobile
export const BackButtonCompact: React.FC<BackButtonProps> = ({
  fallbackPath,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getSmartFallback = (): string => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.includes('orders')) {
      if (pathSegments.includes('track')) {
        return `/${pathSegments[0]}/orders/${pathSegments[2]}`;
      }
      if (pathSegments.length > 2) {
        return `/${pathSegments[0]}/orders`;
      }
    }
    
    switch (user?.role) {
      case 'pressing':
        return '/pressing/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'client':
      default:
        return '/';
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const fallback = fallbackPath || getSmartFallback();
      navigate(fallback);
    }
  };

  const defaultClasses = "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors";

  return (
    <button
      onClick={handleBack}
      className={className || defaultClasses}
      type="button"
      aria-label="Retour"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
};

export default BackButton;
