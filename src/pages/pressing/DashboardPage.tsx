import React, { useState } from 'react';
import KPICard from '../../components/business/KPICard';
import BusinessOrderCard from '../../components/business/BusinessOrderCard';
import { 
  useGetPressingStatsQuery, 
  useGetPressingOrdersQuery,
  useGetPressingNotificationsQuery,
  useUpdateOrderStatusMutation,
  PressingOrder,
  PressingStats
} from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Backend statuses
import { OrderStatus, FrontendOrderStatus, mapToFrontendStatus, mapToBackendStatus } from '../../types/order';

// Map backend order status to frontend status (using the imported helper function)
const mapOrderStatus = (status: string): FrontendOrderStatus => {
  // Convert string status to OrderStatus type value if possible
  const validStatuses: OrderStatus[] = ['en_attente', 'confirmee', 'en_cours', 'prete', 'livree', 'annulee'];
  const orderStatus = validStatuses.includes(status as OrderStatus) 
    ? status as OrderStatus 
    : 'en_attente';
  return mapToFrontendStatus(orderStatus);
};


// Format order data for display
const formatOrderForDisplay = (order: PressingOrder) => ({
  id: order.id,
  customerName: order.customerName,
  customerPhone: order.customerPhone,
  items: order.items.map(item => ({
    type: item.type,
    quantity: item.quantity,
    price: item.price
  })),
  status: mapOrderStatus(order.status),
  totalAmount: order.totalAmount,
  createdAt: order.createdAt,
  pickupDate: order.pickupDate,
  deliveryDate: order.deliveryDate,
  notes: order.notes
});

const DashboardPage: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'notifications'>('stats');
  
  // API Mutation for updating order status
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // API Hooks
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetPressingStatsQuery();
  
  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useGetPressingOrdersQuery({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'en_attente,en_cours,prete' // Only get active orders
  });

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError
  } = useGetPressingNotificationsQuery();

  // Format notifications
  const notifications = (notificationsData || []).map(notification => ({
    id: notification.id,
    type: notification.type === 'order' ? 'urgent' : 
          notification.type === 'payment' ? 'success' : 'info',
    message: notification.message,
    time: formatDistanceToNow(new Date(notification.createdAt), { 
      addSuffix: true,
      locale: fr 
    })
  } as const));

  // Format recent orders
  const recentOrders = (ordersData?.orders || []).slice(0, 5).map(formatOrderForDisplay);

  // Loading and error states
  if (statsLoading || ordersLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  const error = statsError || ordersError || notificationsError;
  if (error) {
    console.error('Error loading dashboard data:', error);
    return (
      <div className="p-4 text-red-500">
        Erreur lors du chargement des données. Veuillez réessayer plus tard.
      </div>
    );
  }

  // Utilisation des données réelles ou valeurs par défaut
  const dashboardStats: PressingStats = {
    todayOrders: stats?.todayOrders ?? 0,
    monthlyRevenue: stats?.monthlyRevenue ?? 0,
    activeCustomers: stats?.activeCustomers ?? 0,
    avgRating: stats?.avgRating ?? 0,
    pendingOrders: stats?.pendingOrders ?? 0,
    completedToday: stats?.completedToday ?? 0,
    weeklyGrowth: stats?.weeklyGrowth ?? 0,
    monthlyGrowth: stats?.monthlyGrowth ?? 0
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // First, ensure the status is a valid frontend status
      const validStatus: FrontendOrderStatus = 
        (['nouveau', 'en_cours', 'pret', 'livre'] as const).includes(newStatus as any)
          ? newStatus as FrontendOrderStatus
          : 'nouveau';
      
      // Map frontend status to backend status
      const backendStatus = mapToBackendStatus(validStatus);
      
      if (!backendStatus) {
        throw new Error('Statut invalide');
      }
      
      await updateOrderStatus({
        orderId,
        status: backendStatus as any // Type assertion pour résoudre le conflit de types
      }).unwrap();
      
      toast.success(`Statut de la commande mis à jour avec succès`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour du statut de la commande');
    }
  };

  const handleViewDetails = (orderId: string) => {
    // Navigate to order details
    window.location.href = `/pressing/orders/${orderId}`;
  };

  const handlePrintLabel = (orderId: string) => {
    // Open print dialog for the order
    window.open(`/pressing/orders/${orderId}/print`, '_blank');
  };

  const handleContactCustomer = (orderId: string) => {
    // Find the order to get customer phone number
    const order = ordersData?.orders.find(o => o.id === orderId);
    if (order?.customerPhone) {
      window.open(`tel:${order.customerPhone}`, '_self');
    } else {
      toast.error('Numéro de téléphone du client non disponible');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Container with Strategic Margins */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        
        {/* Header - Mobile-First Typography */}
        <header className="mb-6 sm:mb-8" role="banner">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
            🏢 Tableau de bord
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Vue d'ensemble de votre pressing
          </p>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </header>

        {/* KPIs Grid - Mobile-First 4-Point Flexible Grid */}
        <section className="mb-6 sm:mb-8" aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Indicateurs de performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <KPICard
              title="Commandes aujourd'hui"
              value={dashboardStats.todayOrders}
              icon="📦"
              color="blue"
              trend={{ value: dashboardStats.weeklyGrowth || 15, isPositive: (dashboardStats.weeklyGrowth || 15) > 0 }}
            />
            <KPICard
              title="En attente"
              value={dashboardStats.pendingOrders}
              icon="⏳"
              color="orange"
              trend={{ value: 2, isPositive: false }}
            />
            <KPICard
              title="Terminées aujourd'hui"
              value={dashboardStats.completedToday}
              icon="✅"
              color="green"
              trend={{ value: 20, isPositive: true }}
            />
            <KPICard
              title="Revenus du mois"
              value={`${(dashboardStats.monthlyRevenue || 0).toLocaleString()} FCFA`}
              icon="💰"
              color="green"
              trend={{ value: dashboardStats.monthlyGrowth || 8, isPositive: (dashboardStats.monthlyGrowth || 8) > 0 }}
            />
            <KPICard
              title="Clients actifs"
              value={dashboardStats.activeCustomers}
              icon="👥"
              color="purple"
              trend={{ value: 12, isPositive: true }}
            />
            <KPICard
              title="Note moyenne"
              value={`${(dashboardStats.avgRating || 0).toFixed(1)}/5`}
              icon="⭐"
              color="orange"
              trend={{ value: 3, isPositive: true }}
            />
          </div>
        </section>

        {/* Main Content Grid - Mobile-First Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Recent Orders - Mobile-First Design */}
          <section className="lg:col-span-2" aria-labelledby="recent-orders-heading">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                  <h2 id="recent-orders-heading" className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                    📦 Commandes récentes
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {dashboardStats.pendingOrders} en attente
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {dashboardStats.completedToday} terminées
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {recentOrders.length > 0 ? (
                    recentOrders.map(order => (
                      <BusinessOrderCard
                        key={order.id}
                        order={{
                          id: order.id,
                          customerName: order.customerName || 'Client inconnu',
                          customerPhone: order.customerPhone || '',
                          items: order.items || [],
                          status: mapOrderStatus(order.status),
                          totalAmount: order.totalAmount || 0,
                          createdAt: order.createdAt,
                          pickupDate: order.pickupDate,
                          deliveryDate: order.deliveryDate,
                          notes: order.notes
                        }}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                        onPrintLabel={handlePrintLabel}
                        onContactCustomer={handleContactCustomer}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                      <div className="text-4xl sm:text-5xl mb-3">📦</div>
                      <p className="text-base sm:text-lg font-medium mb-1">Aucune commande récente</p>
                      <p className="text-sm sm:text-base">Les nouvelles commandes apparaîtront ici</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 sm:mt-6 text-center">
                  <button 
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    aria-label="Voir toutes les commandes"
                  >
                    Voir toutes les commandes →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar - Mobile-First Responsive */}
          <aside className="space-y-4 sm:space-y-6" aria-label="Actions et notifications">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 leading-tight">
                  ⚡ Actions rapides
                </h3>
                <div className="space-y-3">
                  <button 
                    className="w-full min-h-[44px] bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Créer une nouvelle commande"
                  >
                    ➕ Nouvelle commande
                  </button>
                  <button 
                    className="w-full min-h-[44px] border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Gérer les clients"
                  >
                    👥 Gérer les clients
                  </button>
                  <button 
                    className="w-full min-h-[44px] border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Accéder aux paramètres"
                  >
                    🛠️ Paramètres
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 leading-tight">
                  🔔 Notifications
                </h3>
                <div className="space-y-3">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {notif.type === 'urgent' && <span className="text-red-500 text-lg" aria-label="Urgent">🚨</span>}
                        {notif.type === 'info' && <span className="text-blue-500 text-lg" aria-label="Information">ℹ️</span>}
                        {notif.type === 'success' && <span className="text-green-500 text-lg" aria-label="Succès">✅</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-gray-900 leading-relaxed">{notif.message}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Il y a {notif.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm sm:text-base">Aucune notification</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <button 
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-blue-600 hover:text-blue-800 text-sm sm:text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    aria-label="Voir toutes les notifications"
                  >
                    Voir toutes →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 leading-tight">
                  📊 Aperçu rapide
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm sm:text-base text-gray-600">Taux de satisfaction</span>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">94%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm sm:text-base text-gray-600">Délai moyen</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">24h</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm sm:text-base text-gray-600">Commandes en retard</span>
                    <span className="font-semibold text-red-600 text-sm sm:text-base">2</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
