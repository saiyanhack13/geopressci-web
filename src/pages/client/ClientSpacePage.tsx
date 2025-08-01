import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, 
  Package, 
  Clock, 
  CreditCard, 
  MapPin, 
  Bell, 
  Heart, 
  Settings,
  BarChart3,
  Calendar,
  Star,
  Truck
} from 'lucide-react';

const ClientSpacePage: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Nouvelle commande',
      description: 'Créer une nouvelle commande de pressing',
      icon: Package,
      href: '/client/orders/create',
      color: 'bg-blue-500 hover:bg-blue-600',
      emoji: '📦'
    },
    {
      title: 'Mes commandes',
      description: 'Voir toutes mes commandes en cours et passées',
      icon: Clock,
      href: '/client/orders',
      color: 'bg-green-500 hover:bg-green-600',
      emoji: '📋'
    },
    {
      title: 'Suivi commandes',
      description: 'Suivre mes commandes en temps réel',
      icon: Truck,
      href: '/client/orders',
      color: 'bg-orange-500 hover:bg-orange-600',
      emoji: '🚚'
    },
    {
      title: 'Paiements',
      description: 'Gérer mes méthodes de paiement',
      icon: CreditCard,
      href: '/client/payment-methods',
      color: 'bg-purple-500 hover:bg-purple-600',
      emoji: '💳'
    }
  ];

  const menuItems = [
    {
      title: 'Tableau de bord',
      description: 'Vue d\'ensemble de mon activité',
      icon: BarChart3,
      href: '/client/dashboard',
      emoji: '📊'
    },
    {
      title: 'Mon profil',
      description: 'Gérer mes informations personnelles',
      icon: User,
      href: '/client/profile',
      emoji: '👤'
    },
    {
      title: 'Mes adresses',
      description: 'Gérer mes adresses de livraison',
      icon: MapPin,
      href: '/client/addresses',
      emoji: '📍'
    },
    {
      title: 'Historique',
      description: 'Consulter l\'historique de mes commandes',
      icon: Calendar,
      href: '/client/history',
      emoji: '📅'
    },
    {
      title: 'Favoris',
      description: 'Mes pressings favoris',
      icon: Heart,
      href: '/client/favorites',
      emoji: '❤️'
    },
    {
      title: 'Notifications',
      description: 'Gérer mes préférences de notification',
      icon: Bell,
      href: '/client/notifications',
      emoji: '🔔'
    },
    {
      title: 'Transactions',
      description: 'Historique de mes paiements',
      icon: CreditCard,
      href: '/client/transactions',
      emoji: '💰'
    },
    {
      title: 'Paramètres',
      description: 'Configuration de mon compte',
      icon: Settings,
      href: '/client/settings',
      emoji: '⚙️'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-4xl">👤</span>
                  Espace Client
                </h1>
                <p className="mt-2 text-gray-600">
                  Bienvenue {user?.prenom || user?.name} ! Gérez vos commandes et votre profil.
                </p>
              </div>
              <Link
                to="/client/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions rapides */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{action.emoji}</span>
                  <action.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Menu principal */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">📱</span>
            Mon espace
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {item.emoji}
                  </span>
                  <item.icon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📈</span>
            Aperçu rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Commandes en cours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Commandes terminées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0 FCFA</div>
              <div className="text-sm text-gray-600">Total dépensé</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 flex items-center justify-center gap-1">
                <Star className="w-6 h-6 fill-current" />
                0
              </div>
              <div className="text-sm text-gray-600">Pressings favoris</div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🚀 Prêt à commencer ?</h3>
          <p className="text-lg mb-6 opacity-90">
            Trouvez le pressing parfait près de chez vous et passez votre première commande !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              🔍 Rechercher un pressing
            </Link>
            <Link
              to="/client/orders/create"
              className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
            >
              📦 Nouvelle commande
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSpacePage;
