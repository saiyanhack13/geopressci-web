import React, { useState, useEffect } from 'react';
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

  // Debug: Log des services reçus
  useEffect(() => {
    console.log('🔧 ServiceSelector - Services reçus:', services);
    console.log('🔧 ServiceSelector - Nombre de services:', services.length);
    services.forEach((service, index) => {
      console.log(`🔧 Service ${index}:`, {
        id: service._id || service.id,
        name: service.name || service.nom,
        price: service.price || service.prix
      });
    });
  }, [services]);

  // Debug: Log des sélections
  useEffect(() => {
    console.log('🔧 ServiceSelector - Sélections actuelles:', Array.from(selectedItems.values()));
  }, [selectedItems]);

  const handleQuantityChange = (service: PressingService, change: number) => {
    // Utiliser un ID unique et fiable
    const serviceId = service._id || service.id || `service-${service.name}-${service.price}`;
    
    console.log('🔧 handleQuantityChange appelé:', {
      service: {
        id: serviceId,
        name: service.name || service.nom,
        price: service.price || service.prix
      },
      change,
      currentSelections: Array.from(selectedItems.keys())
    });

    const newSelectedItems = new Map(selectedItems);
    const existingItem = newSelectedItems.get(serviceId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    console.log('🔧 Calcul quantité:', {
      currentQuantity,
      change,
      newQuantity
    });

    if (newQuantity === 0) {
      newSelectedItems.delete(serviceId);
      console.log('🔧 Service supprimé:', serviceId);
    } else {
      const selectedItem: SelectedItem = {
        serviceId: serviceId,
        quantity: newQuantity,
        name: service.name || service.nom || 'Service',
        price: service.price || service.prix || 0
      };
      
      newSelectedItems.set(serviceId, selectedItem);
      console.log('🔧 Service ajouté/modifié:', selectedItem);
    }

    setSelectedItems(newSelectedItems);
    const itemsArray = Array.from(newSelectedItems.values());
    console.log('🔧 Envoi vers parent:', itemsArray);
    onSelectionChange(itemsArray);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Choisissez vos services</h3>
      </div>
      <div>
        <div className="space-y-4">
          {services.map((service, index) => {
            // Utiliser un ID unique et fiable
            const serviceId = service._id || service.id || `service-${service.name}-${service.price}`;
            const selected = selectedItems.get(serviceId);
            const quantity = selected ? selected.quantity : 0;
            const uniqueKey = `service-${serviceId}-${index}`;
            
            const serviceName = service.name || service.nom || 'Service';
            const servicePrice = service.price || service.prix || 0;

            return (
              <div key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-l-blue-500">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{serviceName}</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      ID: {serviceId.substring(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">{servicePrice.toLocaleString()} FCFA</p>
                  {quantity > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Sous-total: {(servicePrice * quantity).toLocaleString()} FCFA
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleQuantityChange(service, -1)} 
                      disabled={quantity === 0}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg w-8 text-center text-blue-600">
                      {quantity}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleQuantityChange(service, 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
