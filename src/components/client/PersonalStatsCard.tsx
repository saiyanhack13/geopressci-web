import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  TrendingUp, 
  Package, 
  Star, 
  Calendar, 
  MapPin, 
  CreditCard,
  Download,
  FileText,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useGetCurrentUserQuery } from '../../services/api';
import { clientStatsService, ClientStats } from '../../services/clientStatsService';
import { Order } from '../../types';
import { toast } from 'react-hot-toast';

interface PersonalStatsCardProps {
  orders: Order[];
  className?: string;
}

export const PersonalStatsCard: React.FC<PersonalStatsCardProps> = ({ orders, className = '' }) => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Récupérer les données utilisateur
  const { data: currentUser } = useGetCurrentUserQuery();

  // Calculer les statistiques quand les données sont disponibles
  useEffect(() => {
    const calculateStats = async () => {
      if (!orders || orders.length === 0) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const calculatedStats = await clientStatsService.calculatePersonalStats(orders);
        setStats(calculatedStats);
      } catch (error) {
        console.error('Erreur calcul statistiques:', error);
        toast.error('❌ Erreur lors du calcul des statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [orders]);

  // Export PDF des statistiques
  const handleExportStats = async () => {
    if (!stats || !orders || orders.length === 0) {
      toast.error('❌ Données insuffisantes pour l\'export');
      return;
    }

    setIsExporting(true);
    try {
      await clientStatsService.exportClientData(
        orders,
        stats,
        {
          format: 'pdf',
          includeDetails: true
        }
      );
      
      toast.success('📊 Statistiques exportées en PDF avec succès!');
    } catch (error) {
      console.error('Erreur export statistiques:', error);
      toast.error('❌ Erreur lors de l\'export des statistiques');
    } finally {
      setIsExporting(false);
    }
  };

  // Export JSON des données
  const handleExportJSON = async () => {
    if (!stats || !orders || orders.length === 0) {
      toast.error('❌ Données insuffisantes pour l\'export');
      return;
    }

    setIsExporting(true);
    try {
      await clientStatsService.exportClientData(
        orders,
        stats,
        {
          format: 'json',
          includeDetails: true
        }
      );
      
      toast.success('📄 Données exportées en JSON avec succès!');
    } catch (error) {
      console.error('Erreur export JSON:', error);
      toast.error('❌ Erreur lors de l\'export JSON');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Mes Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Calcul en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Mes Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée disponible</p>
            <p className="text-sm">Passez votre première commande pour voir vos statistiques</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Mes Statistiques
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={isExporting}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            
            <button
              onClick={handleExportStats}
              disabled={isExporting}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {isExporting ? 'Export...' : 'PDF'}
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Commandes totales */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Commandes totales</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Commandes livrées */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Commandes livrées</p>
                <p className="text-2xl font-bold text-green-900">{stats.deliveredOrders}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Montant total dépensé */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total dépensé</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.totalSpent.toLocaleString()} FCFA
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          {/* Pressing favori */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pressing favori</p>
                <p className="text-lg font-bold text-orange-900 truncate">
                  {stats.favoritePressing}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          {/* Service le plus utilisé */}
          <div className="bg-teal-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-600 font-medium">Service favori</p>
                <p className="text-lg font-bold text-teal-900 truncate">
                  {stats.mostUsedService}
                </p>
              </div>
              <Star className="w-8 h-8 text-teal-500" />
            </div>
          </div>

          {/* Taux de satisfaction */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Satisfaction</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.satisfactionRate}%</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Données mensuelles */}
        {stats.monthlyData && stats.monthlyData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution mensuelle
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.monthlyData.slice(-6).map((monthData, index) => (
                  <div key={index} className="bg-white p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-600">{monthData.month}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold text-gray-900">
                        {monthData.orders} commande{monthData.orders > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm text-gray-500">
                        {monthData.amount.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Informations complémentaires */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Informations temporelles
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Membre depuis:</span>
                <span>{new Date(stats.memberSince).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Dernière commande:</span>
                <span>{new Date(stats.lastOrderDate).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Panier moyen:</span>
                <span>{Math.round(stats.averageOrderValue).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Répartition des statuts
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="capitalize">{status.replace('_', ' ')}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalStatsCard;
