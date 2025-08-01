import React, { useState, useMemo } from 'react';
import { ArrowLeft, BarChart2, TrendingUp, TrendingDown, Users, Star, DollarSign, Download, Calendar } from 'lucide-react';
import { 
  useGetPressingStatsQuery,
  useGetPressingEarningsQuery,
  useGetPressingOrdersQuery,
  useGetPressingReviewsQuery
} from '../../services/pressingApi';
import { formatCurrency } from '../../utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  isLoading?: boolean;
  isCurrency?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  isLoading = false,
  isCurrency = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;
  const hasChange = change !== undefined && changeType;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-2">{displayValue}</p>
      {hasChange && (
        <div className={`flex items-center text-sm mt-1 ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
          {changeType === 'increase' ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          <span>{Math.abs(change)}% vs période précédente</span>
        </div>
      )}
    </div>
  );
};

interface ChartPlaceholderProps {
  title: string;
  height?: string;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title, height = 'h-64' }) => (
  <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${height}`}>
    <div className="text-center text-gray-500">
      <BarChart2 className="w-12 h-12 mx-auto mb-2" />
      <p>Graphique pour "{title}"</p>
    </div>
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Fetch data from the API
  const { data: stats, isLoading: isLoadingStats } = useGetPressingStatsQuery();
  const { data: earnings, isLoading: isLoadingEarnings } = useGetPressingEarningsQuery({
    period: timeRange === '7d' ? 'daily' : timeRange === '30d' ? 'weekly' : 'monthly'
  });
  
  const { data: ordersData } = useGetPressingOrdersQuery({
    limit: 100, // Get more orders for better stats
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const { data: reviewsData } = useGetPressingReviewsQuery({});
  
  // Process data for the UI
  const orderStatusDistribution = useMemo(() => {
    if (!ordersData?.orders) return {};
    
    return ordersData.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [ordersData]);
  
  // Get top services from earnings data
  const topServices = useMemo(() => {
    if (!earnings?.topServices) return [];
    
    return earnings.topServices
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
      .map(service => ({
        name: service.service,
        value: service.revenue,
        count: service.count
      }));
  }, [earnings]);
  
  // Get top clients from orders
  const topClients = useMemo(() => {
    if (!ordersData?.orders) return [];
    
    const clientSpending = ordersData.orders.reduce((acc, order) => {
      const clientKey = order.customerName || order.customerEmail || 'Client inconnu';
      acc[clientKey] = (acc[clientKey] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(clientSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, value]) => ({
        name,
        value
      }));
  }, [ordersData]);
  
  const isLoading = isLoadingStats || isLoadingEarnings;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="p-2 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <BarChart2 className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">Analyse des Performances</h1>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Exporter les données
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button onClick={() => setTimeRange('7d')} className={`px-3 py-1 rounded-md text-sm ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>7 jours</button>
            <button onClick={() => setTimeRange('30d')} className={`px-3 py-1 rounded-md text-sm ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>30 jours</button>
            <button onClick={() => setTimeRange('90d')} className={`px-3 py-1 rounded-md text-sm ${timeRange === '90d' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>90 jours</button>
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50">
            <Calendar className="w-4 h-4" />
            <span>Personnaliser</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Revenu Total" 
            value={stats?.monthlyRevenue || 0} 
            change={stats?.monthlyGrowth}
            changeType={stats?.monthlyGrowth && stats.monthlyGrowth >= 0 ? 'increase' : 'decrease'}
            icon={DollarSign}
            isLoading={isLoading}
            isCurrency
          />
          <StatCard 
            title="Nouvelles Commandes" 
            value={stats?.todayOrders || 0}
            change={stats?.weeklyGrowth}
            changeType={stats?.weeklyGrowth && stats.weeklyGrowth >= 0 ? 'increase' : 'decrease'}
            icon={BarChart2}
            isLoading={isLoading}
          />
          <StatCard 
            title="Clients Actifs" 
            value={stats?.activeCustomers || 0}
            icon={Users}
            isLoading={isLoading}
          />
          <StatCard 
            title="Note Moyenne" 
            value={reviewsData?.averageRating ? `${reviewsData.averageRating.toFixed(1)}/5` : 'N/A'}
            icon={Star}
            isLoading={isLoading}
          />
        </div>

        {/* Graphiques */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des revenus</h3>
          {isLoadingEarnings ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-500">Chargement des données...</div>
            </div>
          ) : earnings?.daily?.length || earnings?.weekly?.length || earnings?.monthly?.length ? (
            <ChartPlaceholder 
              title={`Revenus sur ${timeRange}`} 
              height="h-64"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Aucune donnée de revenus disponible
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services les plus populaires</h3>
            {isLoadingEarnings ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-100 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : topServices.length > 0 ? (
              <div className="space-y-4">
                {topServices.map((service, index) => {
                  // Calculate percentage for the bar width
                  const maxValue = Math.max(...topServices.map(s => s.value as number));
                  const percentage = (service.value as number / maxValue) * 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800 truncate max-w-[70%]">{service.name}</span>
                        <span className="text-gray-600 whitespace-nowrap ml-2">
                          {formatCurrency(service.value as number)} ({service.count})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${Math.max(20, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                Aucune donnée de services disponible
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des commandes</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Chargement...</div>
              </div>
            ) : Object.keys(orderStatusDistribution).length > 0 ? (
              <ChartPlaceholder 
                title="Statuts des commandes" 
                height="h-full min-h-[200px]"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Aucune commande trouvée
              </div>
            )}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex justify-between items-center py-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
              ))}
            </div>
          ) : topClients.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {topClients.map((client, index) => (
                <li key={index} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-gray-800 truncate max-w-[70%]">{client.name}</span>
                  <span className="text-sm text-gray-600 bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                    {formatCurrency(client.value as number)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Aucune donnée client disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
