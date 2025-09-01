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
    <Card className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-lg font-semibold text-gray-800">Choisissez vos services</h3>
        <p className="text-sm text-gray-600 mt-1">Sélectionnez les services dont vous avez besoin</p>
      </div>
      <div>
        <div className="space-y-3 sm:space-y-4">
          {services.map((service, index) => {
            // Utiliser un ID unique et fiable
            const serviceId = service._id || service.id || `service-${service.name}-${service.price}`;
            const selected = selectedItems.get(serviceId);
            const quantity = selected ? selected.quantity : 0;
            const uniqueKey = `service-${serviceId}-${index}`;
            
            const serviceName = service.name || service.nom || 'Service';
            const servicePrice = service.price || service.prix || 0;

            return (
              <div key={uniqueKey} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-base">{serviceName}</p>
                      {(service.categorie || service.category) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.categorie || service.category}
                        </span>
                      )}
                    </div>
                    {(service.description) && (
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    )}
                    {(service.dureeMoyenne || service.duration) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>⏱️</span>
                        <span>Durée: {service.dureeMoyenne || service.duration}h</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <p className="text-lg font-bold text-blue-600">{servicePrice.toLocaleString()} FCFA</p>
                    {quantity > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        Sous-total: {(servicePrice * quantity).toLocaleString()} FCFA
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center sm:justify-end mt-3 sm:mt-0">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg border px-3 py-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleQuantityChange(service, -1)} 
                      disabled={quantity === 0}
                      className="h-10 w-10 sm:h-8 sm:w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-xl sm:text-lg w-12 sm:w-8 text-center text-blue-600">
                      {quantity}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleQuantityChange(service, 1)}
                      className="h-10 w-10 sm:h-8 sm:w-8"
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
