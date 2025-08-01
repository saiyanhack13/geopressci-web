import React, { useState } from 'react';

interface ChartData {
  date: string;
  users: number;
  orders: number;
  revenue: number;
}

export const AnalyticsChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'revenue'>('users');

  // Données simulées pour les 30 derniers jours
  const chartData: ChartData[] = [
    { date: '01/01', users: 45, orders: 12, revenue: 125000 },
    { date: '02/01', users: 52, orders: 18, revenue: 180000 },
    { date: '03/01', users: 48, orders: 15, revenue: 165000 },
    { date: '04/01', users: 61, orders: 22, revenue: 220000 },
    { date: '05/01', users: 55, orders: 19, revenue: 195000 },
    { date: '06/01', users: 67, orders: 25, revenue: 275000 },
    { date: '07/01', users: 72, orders: 28, revenue: 310000 },
    { date: '08/01', users: 58, orders: 21, revenue: 235000 },
    { date: '09/01', users: 64, orders: 24, revenue: 260000 },
    { date: '10/01', users: 69, orders: 26, revenue: 285000 },
    { date: '11/01', users: 75, orders: 30, revenue: 325000 },
    { date: '12/01', users: 71, orders: 27, revenue: 295000 },
    { date: '13/01', users: 78, orders: 32, revenue: 340000 },
    { date: '14/01', users: 82, orders: 35, revenue: 375000 },
    { date: '15/01', users: 76, orders: 29, revenue: 315000 },
    { date: '16/01', users: 84, orders: 38, revenue: 410000 },
    { date: '17/01', users: 89, orders: 41, revenue: 445000 },
    { date: '18/01', users: 92, orders: 43, revenue: 465000 },
    { date: '19/01', users: 95, orders: 45, revenue: 485000 }
  ];

  const getMaxValue = () => {
    switch (activeTab) {
      case 'users':
        return Math.max(...chartData.map(d => d.users));
      case 'orders':
        return Math.max(...chartData.map(d => d.orders));
      case 'revenue':
        return Math.max(...chartData.map(d => d.revenue));
      default:
        return 100;
    }
  };

  const getValue = (data: ChartData) => {
    switch (activeTab) {
      case 'users':
        return data.users;
      case 'orders':
        return data.orders;
      case 'revenue':
        return data.revenue;
      default:
        return 0;
    }
  };

  const formatValue = (value: number) => {
    switch (activeTab) {
      case 'users':
        return value.toString();
      case 'orders':
        return value.toString();
      case 'revenue':
        return `${(value / 1000).toFixed(0)}k`;
      default:
        return value.toString();
    }
  };

  const getColor = () => {
    switch (activeTab) {
      case 'users':
        return 'bg-blue-500';
      case 'orders':
        return 'bg-green-500';
      case 'revenue':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const maxValue = getMaxValue();

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Commandes
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'revenue'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💰 Revenus
        </button>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between h-64 px-2">
          {chartData.map((data, index) => {
            const value = getValue(data);
            const height = (value / maxValue) * 100;
            
            return (
              <div key={index} className="flex flex-col items-center group">
                <div className="relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.date}: {formatValue(value)}
                  </div>
                  
                  {/* Bar */}
                  <div
                    className={`w-3 ${getColor()} rounded-t transition-all duration-300 hover:opacity-80`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                </div>
                
                {/* Date label */}
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                  {data.date}
                </span>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue(Math.floor(maxValue * 0.75))}</span>
          <span>{formatValue(Math.floor(maxValue * 0.5))}</span>
          <span>{formatValue(Math.floor(maxValue * 0.25))}</span>
          <span>0</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            {chartData.reduce((sum, d) => sum + d.users, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
          📊 Exporter CSV
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
          📈 Exporter PDF
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          📧 Envoyer Rapport
        </button>
      </div>
    </div>
  );
};

export default AnalyticsChart;
