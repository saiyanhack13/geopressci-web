import React, { useState } from 'react';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // en heures
  description: string;
  isActive: boolean;
}

interface ServiceEditorProps {
  service?: Service;
  onSave: (service: Omit<Service, 'id'>) => void;
  onCancel: () => void;
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({ service, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    category: service?.category || 'nettoyage',
    price: service?.price || 0,
    duration: service?.duration || 24,
    description: service?.description || '',
    isActive: service?.isActive ?? true
  });

  const categories = [
    { value: 'nettoyage', label: '🧽 Nettoyage à sec', icon: '🧽' },
    { value: 'lavage', label: '💧 Lavage', icon: '💧' },
    { value: 'repassage', label: '👔 Repassage', icon: '👔' },
    { value: 'retouche', label: '✂️ Retouches', icon: '✂️' },
    { value: 'special', label: '⭐ Service spécial', icon: '⭐' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {service ? '✏️ Modifier le service' : '➕ Nouveau service'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom du service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du service *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Costume 2 pièces"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Prix et durée */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (FCFA) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
              placeholder="2000"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée (heures) *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => handleChange('duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2h - Express</option>
              <option value={4}>4h - Rapide</option>
              <option value={24}>24h - Standard</option>
              <option value={48}>48h - Normal</option>
              <option value={72}>72h - Économique</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez le service, les spécificités..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Statut actif */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Service actif (visible pour les clients)
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {service ? '💾 Sauvegarder' : '➕ Créer le service'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceEditor;
