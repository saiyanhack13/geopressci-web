import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  User,
  Calendar,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { useGetPressingOrdersQuery, useUpdateOrderStatusMutation } from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import useRealTimeOrders from '../../hooks/useRealTimeOrders';
import BusinessOrderCard from '../../components/business/BusinessOrderCard';
import Loader from '../../components/ui/Loader';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    type: string;
    quantity: number;
    price: number;
  }>;
  status: 'nouveau' | 'en_cours' | 'pret' | 'livre';
  totalAmount: number;
  createdAt: string;
  pickupDate?: string;
  deliveryDate?: string;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'express';
}

// Fonction pour mapper les statuts backend vers frontend
const mapApiStatusToLocal = (apiStatus: string): 'nouveau' | 'en_cours' | 'pret' | 'livre' => {
  const statusMap: Record<string, 'nouveau' | 'en_cours' | 'pret' | 'livre'> = {
    // Statuts du modèle Order
    'draft': 'nouveau',
    'pending': 'nouveau', 
    'confirmed': 'nouveau',
    'processing': 'en_cours',
    'ready_for_pickup': 'pret',
    'out_for_delivery': 'en_cours',
    'completed': 'livre',
    'cancelled': 'nouveau',
    'refunded': 'nouveau',
    'on_hold': 'nouveau',
    // Anciens statuts pour compatibilité
    'en_attente': 'nouveau',
    'confirmee': 'nouveau',
    'en_traitement': 'en_cours',
    'prete': 'pret',
    'livree': 'livre',
    'annulee': 'nouveau'
  };
  
  return statusMap[apiStatus] || 'nouveau';
};

type FilterStatus = 'tous' | 'nouveau' | 'en_cours' | 'pret' | 'livre';
type SortBy = 'date' | 'amount' | 'status' | 'priority';

const OrdersManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // États pour les filtres et pagination
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('tous');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  // Hook pour les mises à jour temps réel
  const {
    isConnected
  } = useRealTimeOrders({
    enableNotifications: true,
    onOrderUpdate: (update) => {
      console.log('🔄 Mise à jour de commande reçue (pressing):', update);
      // Rafraîchir les données quand une commande est mise à jour
      refetch();
      
      // Afficher une notification pour les nouvelles commandes
      if (update.status === 'pending' || update.status === 'confirmed') {
        toast.success(`📦 Nouvelle commande: ${update.orderNumber || update.orderId}`, {
          duration: 5000,
          icon: '🔔'
        });
      }
    },
    onNewOrder: (order) => {
      console.log('🆕 Nouvelle commande reçue:', order);
      refetch();
      toast.success(`🎉 Nouvelle commande reçue!`, {
        duration: 6000,
        icon: '📦'
      });
    }
  });
  
  // Hooks API pour récupérer les données réelles
  const { 
    data: ordersData, 
    isLoading, 
    error, 
    refetch 
  } = useGetPressingOrdersQuery({
    page: currentPage,
    limit: 20,
    status: filterStatus !== 'tous' ? filterStatus : undefined,
    search: searchTerm || undefined,
    sortBy: sortBy === 'date' ? 'createdAt' : sortBy,
    sortOrder: 'desc'
  });
  
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  
  // Données mock pour fallback (à supprimer une fois l'API complètement intégrée)
  const [mockOrders] = useState<Order[]>([
    {
      id: 'ORD-2024-001',
      customerName: 'Kouassi Jean',
      customerPhone: '+225 07 12 34 56 78',
      items: [
        { type: 'Costume', quantity: 1, price: 3000 },
        { type: 'Chemise', quantity: 2, price: 1500 }
      ],
      status: 'nouveau',
      totalAmount: 6000,
      createdAt: new Date().toISOString(),
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Urgent pour demain matin',
      priority: 'urgent'
    },
    {
      id: 'ORD-2024-002',
      customerName: 'Aminata Traoré',
      customerPhone: '+225 05 98 76 54 32',
      items: [
        { type: 'Robe', quantity: 1, price: 2500 },
        { type: 'Veste', quantity: 1, price: 2000 }
      ],
      status: 'en_cours',
      totalAmount: 4500,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      priority: 'normal'
    },
    {
      id: 'ORD-2024-003',
      customerName: 'Yao Michel',
      customerPhone: '+225 01 23 45 67 89',
      items: [
        { type: 'Pantalon', quantity: 3, price: 1200 }
      ],
      status: 'pret',
      totalAmount: 3600,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      priority: 'normal'
    },
    {
      id: 'ORD-2024-004',
      customerName: 'Fatou Diallo',
      customerPhone: '+225 09 87 65 43 21',
      items: [
        { type: 'Tailleur', quantity: 1, price: 4000 }
      ],
      status: 'livre',
      totalAmount: 4000,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      priority: 'express'
    },
    {
      id: 'ORD-2024-005',
      customerName: 'Koffi Emmanuel',
      customerPhone: '+225 02 11 22 33 44',
      items: [
        { type: 'Chemise', quantity: 5, price: 1200 },
        { type: 'Pantalon', quantity: 2, price: 1500 }
      ],
      status: 'nouveau',
      totalAmount: 9000,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      priority: 'normal'
    }
  ]);

  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fonction pour mapper les statuts API vers les statuts locaux
  const mapApiStatusToLocal = (apiStatus: string): 'nouveau' | 'en_cours' | 'pret' | 'livre' => {
    switch (apiStatus) {
      case 'en_attente':
      case 'confirmee':
      case 'annulee':
        return 'nouveau';
      case 'en_cours':
        return 'en_cours';
      case 'prete':
        return 'pret';
      case 'livree':
        return 'livre';
      default:
        return 'nouveau';
    }
  };


  
  // Mapper les données API vers le format local avec useMemo pour optimiser les performances
  const orders: Order[] = useMemo(() => {
    if (!ordersData?.orders) return mockOrders;
    
    return ordersData.orders.map((apiOrder: any) => {
      // Extraction du client - backend populate avec ClientDirect
      const clientInfo = apiOrder.customer || apiOrder.client || apiOrder.user || {};
      const customerName = clientInfo.nom && clientInfo.prenom 
        ? `${clientInfo.prenom} ${clientInfo.nom}`.trim()
        : clientInfo.name || clientInfo.fullName || 'Client';
      const customerPhone = clientInfo.telephone || clientInfo.phone || 'Non disponible';
      
      // Extraction des articles - structure Order model
      const itemsList = apiOrder.items || [];
      const mappedItems = itemsList.map((item: any) => ({
        type: item.serviceDetails?.name || item.serviceName || item.name || `Service ${item.service || ''}`,
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price || 0
      }));
      
      // Calcul du montant total - structure Order model avec tous les frais
      const paymentAmount = apiOrder.payment?.amount;
      let finalTotal = 0;
      
      if (paymentAmount?.total && paymentAmount.total > 0) {
        finalTotal = paymentAmount.total;
      } else if (paymentAmount) {
        const subtotal = paymentAmount.subtotal || 0;
        const delivery = paymentAmount.delivery || 0;
        const tax = paymentAmount.tax || 0;
        const tip = paymentAmount.tip || 0;
        const discount = paymentAmount.discount || 0;
        
        finalTotal = subtotal + delivery + tax + tip - discount;
        
        if (apiOrder.fees && Array.isArray(apiOrder.fees)) {
          const additionalFees = apiOrder.fees.reduce((sum: number, fee: any) => {
            return sum + (fee.amount || 0);
          }, 0);
          finalTotal += additionalFees;
        }
      } else {
        finalTotal = mappedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      }
      
      return {
        id: apiOrder._id || apiOrder.id,
        customerName,
        customerPhone,
        items: mappedItems,
        status: mapApiStatusToLocal(apiOrder.status || 'pending'),
        totalAmount: finalTotal,
        createdAt: apiOrder.createdAt || apiOrder.dateCreation || new Date().toISOString(),
        pickupDate: apiOrder.pickupDate || apiOrder.dateCollectePrevue,
        deliveryDate: apiOrder.deliveryDate || apiOrder.dateLivraisonPrevue || apiOrder.estimatedDelivery,
        notes: apiOrder.notes || apiOrder.commentaires,
        priority: apiOrder.priority || apiOrder.priorite || 'normal'
      };
    });
  }, [ordersData?.orders]);
    
  const totalOrders = ordersData?.total || mockOrders.length;
  const totalPages = Math.ceil((ordersData?.total || mockOrders.length) / 20);

  // Les données sont déjà filtrées et triées côté backend via les paramètres de requête
  const filteredOrders: Order[] = orders;

  const statusCounts = {
    tous: orders.length,
    nouveau: orders.filter(o => o.status === 'nouveau').length,
    en_cours: orders.filter(o => o.status === 'en_cours').length,
    pret: orders.filter(o => o.status === 'pret').length,
    livre: orders.filter(o => o.status === 'livre').length
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Mapper les statuts locaux vers les statuts API
      const apiStatus = newStatus === 'nouveau' ? 'en_attente' :
                       newStatus === 'en_cours' ? 'en_traitement' :
                       newStatus === 'pret' ? 'traitement_termine' :
                       newStatus === 'livre' ? 'livree' : 'en_attente';
      
      await updateOrderStatus({ 
        orderId: orderId, 
        status: apiStatus
      }).unwrap();
      toast.success('Statut de la commande mis à jour avec succès');
      refetch(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      // Mettre à jour chaque commande sélectionnée
      for (const orderId of selectedOrders) {
        // Mapper les statuts locaux vers les statuts API
        const apiStatus = newStatus === 'nouveau' ? 'en_attente' :
                         newStatus === 'en_cours' ? 'en_traitement' :
                         newStatus === 'pret' ? 'traitement_termine' :
                         newStatus === 'livre' ? 'livree' : 'en_attente';
        
        await updateOrderStatus({ 
          orderId: orderId, 
          status: apiStatus
        }).unwrap();
      }
      
      toast.success(`${selectedOrders.length} commande(s) mise(s) à jour`);
      setSelectedOrders([]);
      setShowBulkActions(false);
      refetch(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la mise à jour en lot:', error);
      toast.error('Erreur lors de la mise à jour des commandes');
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const handleViewDetails = useCallback((orderId: string) => {
    navigate(`/pressing/orders/${orderId}`);
  }, [navigate]);

  const handlePrintLabel = useCallback((orderId: string) => {
    // TODO: Implémenter l'impression d'étiquette
    toast('Fonction d\'impression d\'étiquette en développement', {
      icon: '📝',
      duration: 3000
    });
  }, []);

  const handleContactCustomer = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.customerPhone) {
      window.open(`tel:${order.customerPhone}`, '_self');
    } else {
      toast.error('Numéro de téléphone non disponible');
    }
  }, [orders]);

  useEffect(() => {
    setShowBulkActions(selectedOrders.length > 0);
  }, [selectedOrders]);

  // États de chargement - UI/UX 2025
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-1 sm:py-8">
          
          {/* Header Skeleton */}
          <header className="mb-8 sm:mb-12">
            <div className="text-center sm:text-left">
              <div className="animate-pulse">
                <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-xl w-80 mx-auto sm:mx-0 mb-3"></div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded-lg w-96 mx-auto sm:mx-0"></div>
              </div>
            </div>
          </header>
          
          {/* Filters Skeleton */}
          <section className="mb-8" aria-label="Filtres en chargement">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="animate-pulse space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-10 bg-gray-200 rounded-xl w-28"></div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-12 bg-gray-200 rounded-xl flex-1"></div>
                    <div className="h-12 bg-gray-200 rounded-xl w-48"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Orders List Skeleton */}
          <section className="space-y-6" aria-label="Commandes en chargement">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-6 bg-gray-200 rounded w-32"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                          <div className="h-4 bg-gray-200 rounded w-36"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    );
  }

  // État d'erreur - UI/UX 2025
  if (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-1 sm:py-8">
          <div className="text-center py-12 sm:py-20">
            <div className="text-6xl sm:text-8xl mb-6" role="img" aria-label="Erreur">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Erreur de chargement
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Impossible de charger les commandes. Veuillez vérifier votre connexion et réessayer.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              aria-label="Réessayer le chargement des commandes"
            >
              <span className="mr-2" role="img" aria-hidden="true">🔄</span>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-1 sm:py-8">
        
        {/* Header - UI/UX 2025 */}
        <header className="mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              <span className="mr-3" role="img" aria-hidden="true">📋</span>
              Gestion des commandes
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
              Gérez toutes vos commandes en cours et historique avec une interface moderne et intuitive
            </p>
          </div>
        </header>

        {/* Filters and Search - UI/UX 2025 */}
        <section className="mb-8" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Filtres et recherche</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8">
              
              {/* Status Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as FilterStatus)}
                      className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        filterStatus === status
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-pressed={filterStatus === status}
                    >
                      <span className="mr-2" role="img" aria-hidden="true">
                        {status === 'tous' && '📊'}
                        {status === 'nouveau' && '🆕'}
                        {status === 'en_cours' && '⚡'}
                        {status === 'pret' && '✅'}
                        {status === 'livre' && '🎉'}
                      </span>
                      <span>
                        {status === 'tous' && 'Toutes'}
                        {status === 'nouveau' && 'Nouvelles'}
                        {status === 'en_cours' && 'En cours'}
                        {status === 'pret' && 'Prêtes'}
                        {status === 'livre' && 'Livrées'}
                      </span>
                      <span className="ml-2 text-xs opacity-75">({count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <label htmlFor="search-orders" className="sr-only">Rechercher des commandes</label>
                  <input
                    id="search-orders"
                    type="text"
                    placeholder="Rechercher par nom, téléphone ou numéro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" role="img" aria-hidden="true">🔍</span>
                </div>
                
                <div className="sm:w-48">
                  <label htmlFor="sort-orders" className="sr-only">Trier les commandes</label>
                  <select
                    id="sort-orders"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base bg-white"
                  >
                    <option value="date">📅 Trier par date</option>
                    <option value="amount">💰 Trier par montant</option>
                    <option value="status">📊 Trier par statut</option>
                    <option value="priority">⚡ Trier par priorité</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bulk Actions - UI/UX 2025 */}
        {showBulkActions && (
          <section className="mb-8" aria-labelledby="bulk-actions-heading">
            <h2 id="bulk-actions-heading" className="sr-only">Actions en lot</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-blue-800 font-medium text-sm sm:text-base">
                      {selectedOrders.length} commande{selectedOrders.length > 1 ? 's' : ''} sélectionnée{selectedOrders.length > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setSelectedOrders([])}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    >
                      Désélectionner tout
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBulkStatusChange('en_cours')}
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-yellow-600 text-white rounded-xl text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                    >
                      <span className="mr-2" role="img" aria-hidden="true">⚡</span>
                      <span className="hidden sm:inline">Marquer en cours</span>
                      <span className="sm:hidden">En cours</span>
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('pret')}
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      <span className="mr-2" role="img" aria-hidden="true">✅</span>
                      <span className="hidden sm:inline">Marquer prêt</span>
                      <span className="sm:hidden">Prêt</span>
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('livre')}
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <span className="mr-2" role="img" aria-hidden="true">🎉</span>
                      <span className="hidden sm:inline">Marquer livré</span>
                      <span className="sm:hidden">Livré</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Orders List - UI/UX 2025 */}
        <section className="space-y-6" aria-labelledby="orders-heading">
          <h2 id="orders-heading" className="sr-only">Liste des commandes</h2>
          
          {/* Select All */}
          {filteredOrders.length > 0 && (
            <div className="bg-gray-50 rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm sm:text-base text-gray-700 font-medium">
                    Sélectionner toutes les commandes visibles ({filteredOrders.length})
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Orders */}
          <div className="space-y-4 sm:space-y-6">
            {filteredOrders.map(order => (
              <article key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <label className="flex-shrink-0 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        aria-label={`Sélectionner la commande ${order.id}`}
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <BusinessOrderCard
                          order={order}
                          onStatusChange={handleStatusChange}
                          onViewDetails={handleViewDetails}
                          onPrintLabel={handlePrintLabel}
                          onContactCustomer={handleContactCustomer}
                        />
                        {/* Priority Badge */}
                        {order.priority !== 'normal' && (
                          <div className="absolute top-0 right-0">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              order.priority === 'urgent' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              <span className="mr-1" role="img" aria-hidden="true">
                                {order.priority === 'urgent' ? '🚨' : '⚡'}
                              </span>
                              {order.priority === 'urgent' ? 'URGENT' : 'EXPRESS'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Empty State - UI/UX 2025 */}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 sm:py-20">
              <div className="text-6xl sm:text-8xl mb-6" role="img" aria-label="Aucune commande">
                {searchTerm || filterStatus !== 'tous' ? '🔍' : '📋'}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || filterStatus !== 'tous' ? 'Aucune commande trouvée' : 'Aucune commande'}
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'tous'
                  ? 'Essayez de modifier vos filtres ou votre recherche pour trouver des commandes.'
                  : 'Vous n\'avez pas encore de commandes. Commencez par créer votre première commande.'}
              </p>
              {(!searchTerm && filterStatus === 'tous') && (
                <button className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm">
                  <span className="mr-2" role="img" aria-hidden="true">➕</span>
                  Créer une nouvelle commande
                </button>
              )}
            </div>
          )}
        </section>

        {/* Stats Summary - UI/UX 2025 */}
        {filteredOrders.length > 0 && (
          <section className="mt-8 sm:mt-12" aria-labelledby="stats-heading">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h3 id="stats-heading" className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8">
                  <span className="mr-3" role="img" aria-hidden="true">📊</span>
                  Résumé des commandes
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{filteredOrders.length}</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Commandes affichées</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                      {filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total FCFA</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                      {filteredOrders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Articles totaux</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">
                      {filteredOrders.length > 0 ? Math.round(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length).toLocaleString() : 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Panier moyen</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default OrdersManagementPage;
