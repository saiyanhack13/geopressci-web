import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetOrdersQuery, useGetCurrentUserQuery } from '../../services/api';
import { OrderStatus, Order } from '../../types';
import OrderCard from '../../components/order/OrderCard';
import { 
  AlertCircle, Filter, Search, Plus, Clock, CheckCircle, Truck, Package, 
  RefreshCw, ArrowLeft, Eye, MapPin, Calendar, CreditCard, 
  ChevronRight, Loader2, X, SlidersHorizontal, Home, Bell
} from 'lucide-react';
import { useNavigate as useNav } from 'react-router-dom';
import toast from 'react-hot-toast';
import useRealTimeOrders from '../../hooks/useRealTimeOrders';

interface QuickStats {
  total: number;
  pending: number;
  inProgress: number;
  delivered: number;
}

const statusConfig = {
  all: { label: 'Tous', icon: '📦', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'En attente', icon: '⏳', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmée', icon: '✅', color: 'bg-green-100 text-green-700' },
  in_progress: { label: 'En cours', icon: '🔄', color: 'bg-blue-100 text-blue-700' },
  ready: { label: 'Prête', icon: '📦', color: 'bg-purple-100 text-purple-700' },
  out_for_delivery: { label: 'En livraison', icon: '🚚', color: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Livrée', icon: '✅', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', icon: '❌', color: 'bg-red-100 text-red-700' }
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'total'>('date');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const { data: currentUser } = useGetCurrentUserQuery();
  
  // Hook pour les mises à jour temps réel
  const {
    isConnected
  } = useRealTimeOrders({
    enableNotifications: true,
    onOrderUpdate: (update) => {
      console.log('🔄 Mise à jour de commande reçue (client):', update);
      // Rafraîchir les données quand une commande est mise à jour
      refetch();
      
      // Afficher une notification selon le statut
      if (update.status === 'ready_for_pickup') {
        toast.success(`✅ Votre commande ${update.orderNumber || update.orderId} est prête!`, {
          duration: 8000,
          icon: '🎉'
        });
      } else if (update.status === 'out_for_delivery') {
        toast.success(`🚚 Votre commande ${update.orderNumber || update.orderId} est en livraison!`, {
          duration: 6000,
          icon: '🚛'
        });
      } else if (update.status === 'completed') {
        toast.success(`🎊 Commande ${update.orderNumber || update.orderId} livrée avec succès!`, {
          duration: 10000,
          icon: '✨'
        });
      }
    },
    onOrderConfirmation: (order) => {
      console.log('✅ Confirmation de commande reçue:', order);
      refetch();
      toast.success(`🎉 Votre commande a été confirmée!`, {
        duration: 5000,
        icon: '✅'
      });
    }
  });

  // Récupérer les commandes avec rafraîchissement automatique
  const { data: ordersResponse, isLoading, error, refetch } = useGetOrdersQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
    page: 1,
    limit: 50
  }, {
    // Rafraîchissement automatique toutes les 30 secondes pour les pressings
    pollingInterval: currentUser?.role === 'pressing' ? 30000 : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  
  // Extraire les commandes de la réponse
  const orders = (ordersResponse as any)?.data || ordersResponse || [];

  // Statistiques rapides
  const stats: QuickStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o: Order) => o.statut === 'en_attente' || o.statut === undefined).length,
      inProgress: orders.filter((o: Order) => ['confirmee', 'en_traitement', 'en_cours_collecte', 'collectee', 'prete'].includes(o.statut || '')).length,
      delivered: orders.filter((o: Order) => o.statut === 'livree' || o.statut === undefined).length
    };
  }, [orders]);

  // Filtrage des commandes
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order: Order) => order.statut === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order: Order) => 
        order.reference?.toLowerCase().includes(query) ||
        order._id?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [orders, statusFilter, searchQuery]);

  // Effet pour mettre à jour la dernière actualisation
  useEffect(() => {
    if (!isLoading) {
      setLastRefresh(new Date());
    }
  }, [orders, isLoading]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefresh(new Date());
      toast.success('✅ Commandes actualisées');
    } catch (error) {
      toast.error('❌ Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleCreateOrder = useCallback(() => {
    navigate('/client/orders/create');
  }, [navigate]);

  const handleViewOrder = useCallback((orderId: string) => {
    navigate(`/client/orders/${orderId}`);
  }, [navigate]);

  const handleTrackOrder = useCallback((orderId: string) => {
    navigate(`/client/orders/${orderId}/tracking`);
  }, [navigate]);

  // Loading skeleton optimisé mobile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-3 sm:px-4 py-3">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded mb-3"></div>
              <div className="flex space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-full w-16"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="px-3 sm:px-4 py-4 space-y-3">
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          
          {/* Orders skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // État d'erreur avec retry
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oups ! Un problème</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Impossible de charger vos commandes. Vérifiez votre connexion internet.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isRefreshing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Chargement...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Réessayer</>
              )}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Home className="w-4 h-4 mr-2" /> Retour accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {currentUser?.role === 'pressing' ? 'Commandes Reçues' : 'Mes Commandes'}
                </h1>
                {currentUser?.role === 'pressing' && (
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Mise à jour automatique - Dernière actualisation: {lastRefresh.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors duration-200 min-w-[44px] min-h-[44px] ${
                  showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label="Afficher/masquer les filtres"
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Actualiser les commandes"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Barre de recherche - UI/UX 2025 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numéro, pressing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[44px] transition-colors duration-200"
              aria-label="Rechercher dans les commandes"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-200"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filtres par statut - UI/UX 2025 */}
          <div className={`transition-all duration-300 overflow-hidden ${
            showFilters ? 'max-h-24 opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {Object.entries(statusConfig).map(([status, config]) => {
                const isActive = statusFilter === status;
                const count = status === 'all' ? orders.length : orders.filter((o: any) => o.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as OrderStatus | 'all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center space-x-2 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : config.color + ' hover:scale-105 hover:shadow-md'
                    }`}
                    aria-label={`Filtrer par statut ${config.label}`}
                    aria-pressed={isActive}
                  >
                    <span role="img" aria-label={config.label}>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-70 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - UI/UX 2025 */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Statistiques rapides - UI/UX 2025 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600 flex items-center">
              <Package className="w-4 h-4 mr-2" /> Total
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
            <div className="text-sm text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> En attente
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600 flex items-center">
              <RefreshCw className="w-3 h-3 mr-1" /> En cours
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-gray-600 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> Livrées
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucune commande'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
              {searchQuery 
                ? `Aucune commande ne correspond à "${searchQuery}"`
                : 'Vous n\'avez pas encore passé de commande. Commencez dès maintenant !'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateOrder}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle commande
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Indicateur de résultats */}
            <div className="flex items-center justify-between text-sm text-gray-600 px-1">
              <span>
                {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
                {searchQuery && ` pour "${searchQuery}"`}
              </span>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir toutes
                </button>
              )}
            </div>
            
            {/* Cartes de commandes */}
            {filteredOrders.map((order: Order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={() => handleViewOrder(order.id || order._id || '')}
                onTrackOrder={() => handleTrackOrder(order.id || order._id || '')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bouton d'action flottant */}
      <button
        onClick={handleCreateOrder}
        className="fixed bottom-6 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-20 touch-target"
        aria-label="Nouvelle commande"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default OrdersPage;
