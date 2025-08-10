import React, { useMemo } from 'react';
import { SelectedItem } from './ServiceSelector';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PriceCalculatorProps {
  selectedItems: SelectedItem[];
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({ selectedItems }) => {
  const subTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [selectedItems]);

  const serviceFee = subTotal > 0 ? 500 : 0; // Frais de service fixes
  const total = subTotal + serviceFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé de la commande</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedItems.length > 0 ? (
          <div className="space-y-3">
            {selectedItems.map((item, index) => {
              // S'assurer qu'on a toujours une clé unique
              const uniqueKey = item.serviceId || `item-${index}-${item.name}`;
              return (
                <div key={uniqueKey} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString('fr-CI')} FCFA</span>
                </div>
              );
            })}
            <hr className="my-2" />
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{subTotal.toLocaleString('fr-CI')} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais de service</span>
              <span>{serviceFee.toLocaleString('fr-CI')} FCFA</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{total.toLocaleString('fr-CI')} FCFA</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">Vos articles sélectionnés apparaîtront ici.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceCalculator;
