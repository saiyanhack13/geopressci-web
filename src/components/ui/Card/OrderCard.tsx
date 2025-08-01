import React from 'react';
import { Card } from './index';

interface OrderCardProps {
  orderId: string;
  status: string;
  date: string;
  totalAmount: number;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'en cours':
      return 'bg-blue-100 text-blue-800';
    case 'prêt':
      return 'bg-green-100 text-green-800';
    case 'livré':
      return 'bg-secondary text-white';
    case 'annulé':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

const OrderCard: React.FC<OrderCardProps> = ({ orderId, status, date, totalAmount, className }) => {
  return (
    <Card className={className}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg text-neutral-800">Commande #{orderId}</p>
          <p className="text-sm text-neutral-500">{date}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <p className="text-right text-lg font-bold text-primary">{totalAmount.toLocaleString('fr-CI')} FCFA</p>
      </div>
    </Card>
  );
};

export default OrderCard;
