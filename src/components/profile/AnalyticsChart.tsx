import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Users, Package, DollarSign, Eye } from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  change?: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'area';
  period: 'day' | 'week' | 'month' | 'year';
  onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => void;
  loading?: boolean;
  height?: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  data,
  type,
  period,
  onPeriodChange,
  loading = false,
  height = 300
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case 'day': return 'Aujourd\'hui';
      case 'week': return '7 derniers jours';
      case 'month': return '30 derniers jours';
      case 'year': return 'Cette année';
      default: return p;
    }
  };

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((item, index) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const isHovered = hoveredIndex === index;
        
        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative flex-1 w-full flex items-end">
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  item.color || 'bg-blue-500'
                } ${isHovered ? 'opacity-80' : 'opacity-100'}`}
                style={{ height: `${barHeight}%` }}
              />
              {isHovered && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {formatValue(item.value)}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 text-center truncate w-full">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => (
    <div className="relative h-full">
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grille */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}
        
        {/* Ligne */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0);
            return `${x},${y}`;
          }).join(' ')}
        />
        
        {/* Zone sous la courbe */}
        <polygon
          fill="url(#lineGradient)"
          points={[
            ...data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0);
              return `${x},${y}`;
            }),
            `100,100`,
            `0,100`
          ].join(' ')}
        />
        
        {/* Points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0);
          const isHovered = hoveredIndex === index;
          
          return (
            <g key={index}>
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r={isHovered ? "6" : "4"}
                fill="#3B82F6"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {isHovered && (
                <g>
                  <rect
                    x={`${x}%`}
                    y={`${y - 15}%`}
                    width="60"
                    height="20"
                    rx="4"
                    fill="#1F2937"
                    transform="translate(-30, -10)"
                  />
                  <text
                    x={`${x}%`}
                    y={`${y - 8}%`}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                  >
                    {formatValue(item.value)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Labels X */}
      <div className="flex justify-between mt-2">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-gray-600 text-center">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );

  const renderPieChart = () => {
    let cumulativePercentage = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <div className="flex items-center gap-8">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              const strokeDasharray = `${percentage * 2.51} 251`;
              const strokeDashoffset = -cumulativePercentage * 2.51;
              const color = item.color || `hsl(${index * 45}, 70%, 50%)`;
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r="40"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer transition-all hover:stroke-width-[22]"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
          
          {/* Centre du graphique */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(totalValue)}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
        
        {/* Légende */}
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
            const color = item.color || `hsl(${index * 45}, 70%, 50%)`;
            const isHovered = hoveredIndex === index;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded transition-colors ${
                  isHovered ? 'bg-gray-50' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">
                    {formatValue(item.value)} ({percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des données...</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'bar': return renderBarChart();
      case 'line': return renderLineChart();
      case 'pie': return renderPieChart();
      case 'area': return renderLineChart(); // Similaire à line avec remplissage
      default: return renderBarChart();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        {/* Sélecteur de période */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Statistiques rapides */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(totalValue)}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(Math.max(...data.map(d => d.value)))}
            </div>
            <div className="text-sm text-gray-600">Maximum</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(totalValue / data.length)}
            </div>
            <div className="text-sm text-gray-600">Moyenne</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {data.some(d => d.change !== undefined) 
                  ? formatChange(data.reduce((sum, d) => sum + (d.change || 0), 0) / data.filter(d => d.change !== undefined).length)
                  : '--'
                }
              </span>
              {data.some(d => d.change !== undefined) && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="text-sm text-gray-600">Évolution</div>
          </div>
        </div>
      )}

      {/* Graphique */}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>

      {/* Période sélectionnée */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {getPeriodLabel(period)}
      </div>
    </div>
  );
};
