import React, { useState } from 'react';
import { PressingService } from '@/types';
import Button from '../ui/Button';
import { Card } from '../ui/Card/Card';
import { Plus, Minus } from 'lucide-react';

export interface SelectedItem {
  serviceId: string;
  quantity: number;
  name: string;
  price: number;
}

interface ServiceSelectorProps {
  services: PressingService[];
  onSelectionChange: (selectedItems: SelectedItem[]) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ services, onSelectionChange }) => {
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());

  const handleQuantityChange = (service: PressingService, change: number) => {
    const newSelectedItems = new Map(selectedItems);
    const existingItem = newSelectedItems.get(service._id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      newSelectedItems.delete(service._id);
    } else {
      newSelectedItems.set(service._id, { 
        serviceId: service._id,
        quantity: newQuantity,
        name: service.name || service.nom || 'Service',
        price: service.price || service.prix || 0
      });
    }

    setSelectedItems(newSelectedItems);
    onSelectionChange(Array.from(newSelectedItems.values()));
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Choisissez vos services</h3>
      </div>
      <div>
        <div className="space-y-4">
          {services.map((service, index) => {
            const selected = selectedItems.get(service._id);
            const quantity = selected ? selected.quantity : 0;
            const uniqueKey = `service-${service._id}-${index}`;

            return (
              <div key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{service.name || service.nom || 'Service'}</p>
                  <p className="text-sm text-gray-600">{(service.price || service.prix || 0).toLocaleString()} FCFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleQuantityChange(service, -1)} disabled={quantity === 0}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => handleQuantityChange(service, 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ServiceSelector;
