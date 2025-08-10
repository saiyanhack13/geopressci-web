import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useGetOrdersQuery, useLazyGetNearbyPressingsQuery } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Order } from '../../types';
import PersonalStatsCard from '../../components/client/PersonalStatsCard';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Heart, 
  Star, 
  Calendar,
  TrendingUp,
  MapPin,
  Phone,
  ArrowRight,
  Plus,
  Search,
  Bell,
  Settings,
  User,
  ShoppingBag,
  Truck,
  Award,
  AlertCircle,
  Eye
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  favoritePressings: number;
  averageRating: number;
  monthlyOrders: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  pressing: string;
  status: string;
  total: number;
  createdAt: string;
  estimatedDelivery?: string;
}

interface FavoritePressing {
  id: string;
  name: string;
  rating: number;
  distance: string;
  lastOrder?: string;
}

const ClientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Utilisation directe de l'API backend
  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useGetOrdersQuery({ 
    page: 1, 
    limit: 5
  });
  
  const [getNearbyPressings, { 
    data: nearbyPressingsData, 
    isLoading: nearbyLoading 
  }] = useLazyGetNearbyPressingsQuery();
  
  // Extraction des données de l'API
  const orders: Order[] = ordersData || [];
  const recentOrders = orders.slice(0, 3);
  
  // Calcul des statistiques à partir des vraies données
  const stats: DashboardStats = {
    totalOrders: orders.length,
    activeOrders: orders.filter((order: Order) => 
      ['nouveau', 'confirme', 'en_cours', 'prete'].includes(order.status || '')
    ).length,
    completedOrders: orders.filter((order: Order) => order.status === 'livree').length,
    cancelledOrders: orders.filter((order: Order) => order.status === 'annulee').length,
    totalSpent: orders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0),
    favoritePressings: 0, // À implémenter avec l'API des favoris
    averageRating: 4.5, // À calculer avec les avis
    monthlyOrders: orders.filter((order: Order) => {
      const orderDate = new Date(order.createdAt || '');
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).length
  };

  const [favoritePressings] = useState<FavoritePressing[]>([
    {
      id: '1',
      name: 'Pressing Excellence Cocody',
      rating: 4.8,
      distance: '1.2 km',
      lastOrder: '2024-01-15'
    },
    {
      id: '2',
      name: 'Clean Master Plateau',
      rating: 4.6,
      distance: '2.1 km',
      lastOrder: '2024-01-14'
    },
    {
      id: '3',
      name: 'Royal Pressing Yopougon',
      rating: 4.4,
      distance: '3.5 km',
      lastOrder: '2024-01-10'
    }
  ]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode; emoji: string }> = {
      'en_attente': { label: 'En attente', color: 'text-yellow-600 bg-yellow-100', icon: <Clock className="w-4 h-4" />, emoji: '⏳' },
      'confirmee': { label: 'Confirmée', color: 'text-blue-600 bg-blue-100', icon: <CheckCircle className="w-4 h-4" />, emoji: '✅' },
      'en_cours': { label: 'En cours', color: 'text-orange-600 bg-orange-100', icon: <Package className="w-4 h-4" />, emoji: '🔄' },
      'prete': { label: 'Prête', color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-4 h-4" />, emoji: '✨' },
      'en_livraison': { label: 'En livraison', color: 'text-purple-600 bg-purple-100', icon: <Truck className="w-4 h-4" />, emoji: '🚚' },
      'livree': { label: 'Livrée', color: 'text-green-700 bg-green-200', icon: <CheckCircle className="w-4 h-4" />, emoji: '🎉' },
      'annulee': { label: 'Annulée', color: 'text-red-600 bg-red-100', icon: <XCircle className="w-4 h-4" />, emoji: '❌' }
    };
    return statusMap[status] || statusMap['en_attente'];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - UI/UX 2025 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3 mb-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl">📊</span>
                Tableau de bord
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                Bonjour {user?.prenom || user?.name} ! Voici un aperçu de votre activité.
              </p>
            </div>
            <Link
              to="/client/orders/create"
              className="bg-white text-blue-600 px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 min-w-[44px] min-h-[44px] text-sm sm:text-base font-medium shadow-lg"
              aria-label="Créer une nouvelle commande"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nouvelle commande</span>
              <span className="sm:hidden">Nouveau</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        {/* Statistiques principales - UI/UX 2025 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Commandes totales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-green-600 font-medium">+{stats.monthlyOrders} ce mois</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">En cours</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.activeOrders}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-orange-600 font-medium">À suivre</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Terminées</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-500 mr-2 fill-current" />
              <span className="text-gray-600 font-medium">Note: {stats.averageRating}/5</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total dépensé</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{formatPrice(stats.totalSpent)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-green-600 font-medium">Économies</span>
            </div>
          </div>
        </div>

        {/* Statistiques personnelles */}
        <div className="mb-8">
          <PersonalStatsCard orders={orders || []} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Commandes récentes - UI/UX 2025 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    Commandes récentes
                  </h2>
                  <Link
                    to="/client/orders"
                    className="text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center gap-2 text-sm font-medium min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg hover:bg-blue-50"
                    aria-label="Voir toutes les commandes"
                  >
                    Voir tout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-40"></div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => {
                      const statusInfo = getStatusInfo(order.status || 'en_attente');
                      return (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl" role="img" aria-label={`Statut: ${statusInfo.label}`}>
                              {statusInfo.emoji}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {typeof order.pressing === 'string' ? order.pressing : order.pressing?.businessName || 'Pressing'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Commandé le {order.createdAt ? formatDate(order.createdAt) : 'Date inconnue'}
                                {order.estimatedDelivery && ` • Livraison prévue le ${formatDate(order.estimatedDelivery)}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 mb-2">{formatPrice(order.total || 0)}</div>
                            <Link
                              to={`/client/orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 min-w-[44px] min-h-[44px] px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200"
                              aria-label={`Voir les détails de la commande ${order.orderNumber}`}
                            >
                              <Eye className="w-4 h-4" />
                              Voir
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📦</div>
                    <p className="text-gray-600 mb-4">Aucune commande récente</p>
                    <Link
                      to="/client/orders/create"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 min-w-[44px] min-h-[44px]"
                    >
                      <Plus className="w-4 h-4" />
                      Créer une commande
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pressings favoris */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">❤️</span>
                  Mes favoris
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {favoritePressings.map((pressing) => (
                    <div key={pressing.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{pressing.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            {pressing.rating}
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {pressing.distance}
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/pressing/${pressing.id}`}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        Voir
                      </Link>
                    </div>
                  ))}
                </div>
                <Link
                  to="/client/favorites"
                  className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
                >
                  Voir tous mes favoris
                </Link>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  Actions rapides
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to="/search"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Trouver un pressing</div>
                      <div className="text-xs text-gray-500">Rechercher près de moi</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/client/profile"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Mon profil</div>
                      <div className="text-xs text-gray-500">Gérer mes infos</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/client/notifications"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Bell className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Notifications</div>
                      <div className="text-xs text-gray-500">Gérer mes alertes</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🎯 Besoin d'aide ?</h3>
          <p className="text-lg mb-6 opacity-90">
            Notre équipe support est là pour vous accompagner dans vos commandes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/client/support"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              💬 Contacter le support
            </Link>
            <Link
              to="/faq"
              className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
            >
              ❓ FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
