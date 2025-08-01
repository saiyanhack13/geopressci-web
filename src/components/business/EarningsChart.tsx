import React from 'react';

interface EarningsData {
  period: string;
  revenue: number;
  orders: number;
}

interface EarningsChartProps {
  data: EarningsData[];
  type: 'daily' | 'weekly' | 'monthly';
}

const EarningsChart: React.FC<EarningsChartProps> = ({ data, type }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxOrders = Math.max(...data.map(d => d.orders));

  const formatPeriod = (period: string) => {
    if (type === 'daily') return period.split('-').slice(1).join('/');
    if (type === 'weekly') return `S${period}`;
    return period;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Revenus {type === 'daily' ? 'quotidiens' : type === 'weekly' ? 'hebdomadaires' : 'mensuels'}
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Revenus (FCFA)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Commandes</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Chart Area */}
        <div className="flex items-end justify-between space-x-1 h-64 mb-4">
          {data.map((item, index) => {
            const revenueHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            const ordersHeight = maxOrders > 0 ? (item.orders / maxOrders) * 80 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                {/* Revenue Bar */}
                <div className="w-full flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t transition-all duration-500 ease-out relative group"
                    style={{ height: `${revenueHeight}%`, minHeight: item.revenue > 0 ? '4px' : '0' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {item.revenue.toLocaleString()} FCFA
                    </div>
                  </div>
                  
                  {/* Orders Bar */}
                  <div
                    className="w-3/4 bg-blue-500 rounded-t transition-all duration-500 ease-out relative group mt-1"
                    style={{ height: `${ordersHeight}%`, minHeight: item.orders > 0 ? '4px' : '0' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {item.orders} commande{item.orders > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500">
          {data.map((item, index) => (
            <span key={index} className="flex-1 text-center">
              {formatPeriod(item.period)}
            </span>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
          </p>
          <p className="text-sm text-gray-600">Revenus totaux</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, item) => sum + item.orders, 0)}
          </p>
          <p className="text-sm text-gray-600">Commandes totales</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(
              data.reduce((sum, item) => sum + item.revenue, 0) / 
              Math.max(data.reduce((sum, item) => sum + item.orders, 0), 1)
            )}
          </p>
          <p className="text-sm text-gray-600">Panier moyen</p>
        </div>
      </div>
    </div>
  );
};

export default EarningsChart;
