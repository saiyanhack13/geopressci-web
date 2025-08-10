import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { useGetOrdersQuery, useCreateOrderMutation, useGetCurrentUserQuery } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star, 
  ArrowLeft,
  Filter,
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  MessageSquare,
  History, 
  Download,
  FileText,
  BarChart3
} from 'lucide-react';
import { clientStatsService } from '../../services/clientStatsService';
import { Order } from '../../types';

interface OrderHistory {
  id: string;
  orderNumber: string;
  pressingName: string;
  pressingAddress: string;
  pressingId?: string;
  deliveryAddress?: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'completed' | 'cancelled' | 'refunded';
  items: {
    name: string;
    quantity: number;
    price: number;
    service: string;
    serviceId?: string;
  }[];
  totalAmount: number;
  paymentMethod: string;
  rating?: number;
  review?: string;
  canReorder: boolean;
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled' | 'refunded'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'pressing'>('date');
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [createOrder, { isLoading: isReordering }] = useCreateOrderMutation();
  
  // Utilisation directe de l'API backend
  const { 
    data: ordersData, 
    isLoading, 
    error, 
    refetch 
  } = useGetOrdersQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
    page: 1,
    limit: 100
  });
  
  const { data: currentUser } = useGetCurrentUserQuery();

  // Transformation des données API vers OrderHistory
  const orders: OrderHistory[] = useMemo(() => {
    if (!ordersData) return [];
    
    return ordersData.map((order: any) => ({
      id: order.id,
      orderNumber: order.reference || `GEO-${order.id}`,
      pressingName: 'Pressing', // À récupérer depuis l'API pressing
      pressingAddress: 'Abidjan', // À récupérer depuis l'API pressing
      orderDate: order.dateCreation,
      deliveryDate: order.dateLivraison,
      status: order.statut === 'livree' ? 'completed' : 
              order.statut === 'annulee' ? 'cancelled' : 
              order.statut === 'rembourse' ? 'refunded' : 'completed',
      items: order.articles?.map((article: any) => ({
        name: article.nom || 'Article',
        quantity: article.quantite || 1,
        price: article.prix || 0,
        service: article.service || 'Service standard'
      })) || [],
      totalAmount: order.montantTotal || 0,
      paymentMethod: 'Mobile Money', // À récupérer depuis l'API paiement
      rating: 5, // À implémenter avec l'API des avis
      review: '', // À implémenter avec l'API des avis
      canReorder: order.statut === 'livree'
    }));
  }, [ordersData]);

  // Calcul des statistiques
  const completedOrders = useMemo(() => {
    return orders.filter(order => order.status === 'completed').length;
  }, [orders]);

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);

  const averageRating = useMemo(() => {
    const ratedOrders = orders.filter(order => order.rating && order.rating > 0);
    if (ratedOrders.length === 0) return 0;
    return ratedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / ratedOrders.length;
  }, [orders]);

  // Filtrage et tri des commandes (déplacé avant les returns conditionnels)
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.pressingName.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Tri
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'pressing':
          return a.pressingName.localeCompare(b.pressingName);
        default:
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      }
    });
  }, [orders, searchQuery, statusFilter, sortBy]);
  
  // Gestion des erreurs API
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">❌ Erreur lors du chargement de l'historique</p>
              <Button onClick={() => refetch()} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement de l'historique...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'refunded': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      case 'refunded': return 'Remboursée';
      default: return status;
    }
  };

  const handleReorder = async (orderId: string) => {
    setLoading(true);
    try {
      // Logique de recommande - créer une nouvelle commande basée sur l'ancienne
      const originalOrder = orders.find(order => order.id === orderId);
      if (!originalOrder) {
        throw new Error('Commande introuvable');
      }

      // Créer une nouvelle commande avec les mêmes articles
      const newOrderData = {
        pressingId: originalOrder.pressingId!,
        services: originalOrder.items.map(item => ({
          serviceId: item.serviceId || 'default-service',
          quantite: item.quantity,
          instructions: item.service
        })),
        adresseLivraison: originalOrder.deliveryAddress!,
        dateRecuperationSouhaitee: new Date().toISOString(),
        instructionsSpeciales: 'Recommande depuis l\'historique'
      };

      await createOrder(newOrderData).unwrap();
      toast.success(' Nouvelle commande créée avec succès!');
      
      // Rediriger vers la page de suivi de la nouvelle commande
      navigate('/orders');
    } catch (error: any) {
      console.error('Erreur lors de la recommande:', error);
      toast.error(' Erreur lors de la création de la nouvelle commande');
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'export PDF de l'historique
  const handleExportHistoryPDF = async () => {
    if (!filteredOrders.length) {
      toast.error(' Aucune commande à exporter');
      return;
    }

    setIsExporting(true);
    try {
      // Convertir OrderHistory vers Order pour les statistiques
      const ordersForStats = filteredOrders.map(order => ({
        ...order,
        status: order.status === 'completed' ? 'livree' : order.status === 'cancelled' ? 'annulee' : 'refunded',
        pressing: order.pressingName,
        pressingName: order.pressingName
      })) as Order[];
      
      const stats = await clientStatsService.calculatePersonalStats(ordersForStats);
      
      await clientStatsService.exportClientData(
        ordersForStats,
        stats,
        {
          format: 'pdf',
          dateRange: dateFilter !== 'all' ? {
            start: getDateRangeStart(dateFilter),
            end: new Date().toISOString()
          } : undefined,
          includeDetails: false
        }
      );
      
      toast.success(' Historique exporté en PDF avec succès!');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error(' Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction d'export des statistiques personnelles
  const handleExportPersonalStats = async () => {
    if (!filteredOrders.length) {
      toast.error(' Aucune donnée pour les statistiques');
      return;
    }

    setIsExporting(true);
    try {
      // Convertir OrderHistory vers Order pour les statistiques
      const ordersForStats = filteredOrders.map(order => ({
        ...order,
        status: order.status === 'completed' ? 'livree' : order.status === 'cancelled' ? 'annulee' : 'refunded',
        pressing: order.pressingName,
        pressingName: order.pressingName
      })) as Order[];
      
      const stats = await clientStatsService.calculatePersonalStats(ordersForStats);
      
      await clientStatsService.exportClientData(
        ordersForStats,
        stats,
        {
          format: 'pdf',
          includeDetails: true
        }
      );
      
      toast.success(' Statistiques exportées en PDF avec succès!');
    } catch (error) {
      console.error('Erreur export statistiques:', error);
      toast.error(' Erreur lors de l\'export des statistiques');
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction utilitaire pour obtenir la date de début selon le filtre
  const getDateRangeStart = (filter: string): string => {
    const now = new Date();
    switch (filter) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <History className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Historique des Commandes</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportHistoryPDF}
                disabled={isExporting || !filteredOrders.length}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isExporting ? 'Export...' : 'Export PDF'}
                </span>
              </button>
              
              <button 
                onClick={handleExportPersonalStats}
                disabled={isExporting || !filteredOrders.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isExporting ? 'Export...' : 'Statistiques'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{orders.length}</div>
            <div className="text-sm text-gray-600">Commandes totales</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{completedOrders}</div>
            <div className="text-sm text-gray-600">Terminées</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {totalSpent.toLocaleString()} FCFA
            </div>
            <div className="text-sm text-gray-600">Total dépensé</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Note moyenne</div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, pressing, article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtres */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Terminées</option>
                <option value="cancelled">Annulées</option>
                <option value="refunded">Remboursées</option>
              </select>
            </div>

            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les dates</option>
                <option value="30days">30 derniers jours</option>
                <option value="3months">3 derniers mois</option>
                <option value="6months">6 derniers mois</option>
                <option value="1year">Cette année</option>
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Plus récentes</option>
                <option value="oldest">Plus anciennes</option>
                <option value="amount">Montant décroissant</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} trouvée{filteredOrders.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Vous n\'avez pas encore passé de commande'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                {/* En-tête de la commande */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusColor(order.status)
                      }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-gray-600">{order.pressingName}</p>
                    <p className="text-sm text-gray-500">{order.pressingAddress}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {order.totalAmount.toLocaleString()} FCFA
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                    </div>
                    {order.deliveryDate && (
                      <div className="text-sm text-green-600">
                        Livré le {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Articles */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Articles commandés :</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-500">• {item.service}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {(item.quantity * item.price).toLocaleString()} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Évaluation */}
                {order.rating && (
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">Votre évaluation :</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < order.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({order.rating}/5)</span>
                    </div>
                    {order.review && (
                      <p className="text-sm text-gray-600 italic">"{order.review}"</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Payé par {order.paymentMethod}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
                    
                    {order.canReorder && (
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Recommander
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
