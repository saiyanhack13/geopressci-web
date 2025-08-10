import React from 'react';
import { Card, CardContent } from '../ui/card';

interface AdminCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  subtitle,
  onClick
}) => {
  return (
    <Card 
      className={`hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          <div className="text-3xl ml-4">
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              trendUp ? 'text-green-600' : 'text-red-600'
            }`}>
              {trendUp ? '↗️' : '↘️'} {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCard;
