import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { useGetTransactionsQuery } from '../../services/api';
import { PaymentStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Payment } from '../../types';
import { SortBy, SortOrder } from '../../types/sort';
import { MobileMoneyOperator } from '../../components/payment/MobileMoneySelector';
import { MOBILE_MONEY_OPERATORS } from '../../components/payment/MobileMoneySelector';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowLeft, 
  Download, 
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Home,
  Eye,
  Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  transactionId: string;
  orderId: string;
  timestamp: Date;
  operator: MobileMoneyOperator;
  phoneNumber: string;
  amount: number;
  status: PaymentStatus;
  pressingName: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  fees: number;
  discount?: number;
}

const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Utilisation directe de l'API backend
  // Variables d'état
  type FilterStatus = 'all' | PaymentStatus;
  type FilterOperator = 'all' | MobileMoneyOperator['id'];
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [operatorFilter, setOperatorFilter] = useState<FilterOperator>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // API query
  const {
    data: transactionsData,
    isLoading,
    error,
    refetch
  } = useGetTransactionsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.DATE);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [filteredTransactions, setFilteredTransactions] = useState<Payment[]>([]);
  const itemsPerPageMobile = 8; // Réduit pour mobile
  
  // États mobile
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Extraction des données de l'API
  const transactions = transactionsData?.transactions || [];
  const totalTransactions = transactionsData?.total || 0;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  // Fonction de rechargement
  const loadTransactions = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await refetch().unwrap();
      toast.success('Transactions mises à jour');
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, refetch]);

  // Fonction de rafraîchissement
  const handleRefresh = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Gestion des erreurs API
  useEffect(() => {
    if (error) {
      toast.error('Erreur lors du chargement des transactions');
      console.error('Erreur API transactions:', error);
    }
  }, [error]);

  // Filtrage et tri des transactions avec memoization
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Filtrer par opérateur
    if (operatorFilter !== 'all') {
      filtered = filtered.filter(t => t.provider === operatorFilter);
    }
    
    // Recherche textuelle optimisée
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.transactionId.toLowerCase().includes(query) ||
        (typeof t.order === 'string' ? t.order : t.order?.id || '').toLowerCase().includes(query)
      );
    }
    
    // Tri optimisé
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case SortBy.DATE:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case SortBy.AMOUNT:
          comparison = a.amount - b.amount;
          break;
        case SortBy.PROVIDER:
          comparison = a.provider.localeCompare(b.provider);
          break;
        case SortBy.STATUS:
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [transactions, statusFilter, operatorFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    setFilteredTransactions(filteredAndSortedTransactions);
    setCurrentPage(1); // Reset pagination
  }, [filteredAndSortedTransactions]);

  const getStatusConfig = (status: string) => {
    const configs = {
      success: { icon: '✅', text: 'Réussi', color: 'text-green-600', bg: 'bg-green-50' },
      failed: { icon: '❌', text: 'Échoué', color: 'text-red-600', bg: 'bg-red-50' },
      pending: { icon: '⏳', text: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-50' },
      cancelled: { icon: '🚫', text: 'Annulé', color: 'text-gray-600', bg: 'bg-gray-50' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  // Statistiques memoizées pour performance
  const transactionStats = useMemo(() => {
    const successTransactions = transactions.filter((t: Payment) => t.status === 'succeeded');
    return {
      total: transactions.length,
      success: successTransactions.length,
      pending: transactions.filter((t: Payment) => t.status === 'pending').length,
      failed: transactions.filter((t: Payment) => t.status === 'failed').length,
      cancelled: transactions.filter((t: Payment) => t.status === 'canceled').length,
      totalAmount: successTransactions.reduce((sum: number, t: Payment) => sum + t.amount, 0),
      averageAmount: successTransactions.length > 0 ? 
        successTransactions.reduce((sum: number, t: Payment) => sum + t.amount, 0) / successTransactions.length : 0
    };
  }, [transactions]);

  // Fonction pour ouvrir les détails d'une transaction
  const handleTransactionClick = useCallback((transaction: Payment) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  }, []);

  // Fonction pour exporter les données
  const handleExportData = useCallback(async () => {
    try {
      const dataToExport = {
        transactions: filteredAndSortedTransactions,
        stats: transactionStats,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geopressci-transactions-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('📄 Données exportées avec succès');
    } catch (error) {
      toast.error('❌ Erreur lors de l\'export');
    }
  }, [filteredAndSortedTransactions, transactionStats]);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage);

  // États de chargement mobile-first
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Header skeleton */}
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
            
            {/* Transaction cards skeleton */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="px-3 sm:px-4 py-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              {typeof error === 'string' ? error : 'Une erreur est survenue lors du chargement des transactions'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="w-full min-h-[48px] text-base font-medium"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Rechargement...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/client/dashboard')}
                className="w-full min-h-[48px] text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile-first */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => navigate('/client/dashboard')}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors touch-target"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    💳 Mes transactions
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {transactionStats.total} transaction{transactionStats.total > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-target"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExportData}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-target"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Barre de recherche mobile-first */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* Statistiques mobile-first */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {transactionStats.total}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {transactionStats.success}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Réussies</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {transactionStats.failed}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Échouées</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {transactionStats.totalAmount.toLocaleString('fr-FR')}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">FCFA payés</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres mobile-first */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-target"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Masquer' : 'Afficher'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {showFilters && (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                {/* Filtres rapides */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Tous', icon: '📊' },
                      { value: 'success', label: 'Réussi', icon: '✅' },
                      { value: 'pending', label: 'En attente', icon: '⏳' },
                      { value: 'failed', label: 'Échoué', icon: '❌' },
                      { value: 'cancelled', label: 'Annulé', icon: '🚫' }
                    ].map(status => (
                      <button
                        key={status.value}
                        onClick={() => setStatusFilter(status.value as FilterStatus)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
                          statusFilter === status.value
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Opérateurs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opérateur</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setOperatorFilter('all')}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
                        operatorFilter === 'all'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>📱</span>
                      <span>Tous</span>
                    </button>
                    {MOBILE_MONEY_OPERATORS.map(op => (
                      <button
                        key={op.id}
                        onClick={() => setOperatorFilter(op.name)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
                          operatorFilter === op.name
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{op.logo}</span>
                        <span className="hidden sm:inline">{op.displayName}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Tri */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="date">📅 Date</option>
                      <option value="amount">💰 Montant</option>
                      <option value="status">📊 Statut</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="desc">⬇️ Décroissant</option>
                      <option value="asc">⬆️ Croissant</option>
                    </select>
                  </div>
                </div>
                
                {/* Réinitialiser */}
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setOperatorFilter('all');
                      setSortBy(SortBy.DATE);
                      setSortOrder(SortOrder.DESC);
                      setSearchQuery('');
                      toast.success('🔄 Filtres réinitialisés');
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                  >
                    🔄 Réinitialiser les filtres
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Liste des transactions mobile-first */}
          <div className="space-y-3">
            {paginatedTransactions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune transaction trouvée</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {searchQuery || statusFilter !== 'all' || operatorFilter !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Vous n\'avez pas encore effectué de paiement'
                  }
                </p>
                {(searchQuery || statusFilter !== 'all' || operatorFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setStatusFilter('all');
                      setOperatorFilter('all');
                      setSearchQuery('');
                    }}
                    variant="outline"
                    className="min-h-[44px]"
                  >
                    🔄 Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              paginatedTransactions.map((transaction) => {
                const statusConfig = getStatusConfig(transaction.status);
                
                return (
                  <div 
                    key={transaction.id} 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Logo opérateur */}
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">
                          {transaction.provider === 'orangemoney' ? '📱' : 
                           transaction.provider === 'mtnmomo' ? '📱' : 
                           transaction.provider === 'moovmoney' ? '📱' : 
                           transaction.provider === 'wave' ? '🌊' : '💳'}
                        </span>
                      </div>
                      
                      {/* Informations principales */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">
                              {transaction.amount.toLocaleString('fr-FR')} FCFA
                            </h3>
                            <p className="text-sm text-gray-600">
                              {transaction.provider === 'orangemoney' ? 'Orange Money' : 
                               transaction.provider === 'mtnmomo' ? 'MTN Mobile Money' : 
                               transaction.provider === 'moovmoney' ? 'Moov Money' : 
                               transaction.provider === 'wave' ? 'Wave' : 'Carte bancaire'}
                            </p>
                          </div>
                          
                          <div className={`
                            px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1
                            ${statusConfig.color} ${statusConfig.bg}
                          `}>
                            <span>{statusConfig.icon}</span>
                            <span className="hidden sm:inline">{statusConfig.text}</span>
                          </div>
                        </div>
                        
                        {/* Détails */}
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>🏦</span>
                            <span className="truncate">Transaction {transaction.transactionId}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span>📅</span>
                              <span>{new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4 text-gray-400" />
                              <span className="text-xs">Voir détails</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination mobile-first */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="min-h-[44px] w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages}
                </span>
                {totalPages <= 5 ? (
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`
                            w-8 h-8 rounded-full text-sm font-medium transition-colors
                            ${currentPage === page 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">/ {totalPages}</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Actions globales mobile-first */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Button
              onClick={() => navigate('/client/orders')}
              variant="outline"
              className="min-h-[44px] flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Mes commandes</span>
            </Button>
            <Button 
              onClick={() => navigate('/client/dashboard')}
              className="min-h-[44px] flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Tableau de bord</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
