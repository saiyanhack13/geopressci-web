import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Tag, Percent, Gift, Clock, Info } from 'lucide-react';
import { Promotion, PromotionFormData, useGetPressingServicesQuery } from '../../services/pressingApi';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

interface PromotionEditorProps {
  promotion?: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromotionFormData) => Promise<void>;
  isLoading: boolean;
}

const PromotionEditor: React.FC<PromotionEditorProps> = ({
  promotion,
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  // États du formulaire
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    value: 0,
    trialDays: 0,
    buyX: 1,
    getY: 1,
    maxUses: undefined,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    target: {
      type: 'all',
      users: [],
      pressings: [],
    },
    services: [],
    minimumOrderAmount: undefined,
    maximumDiscount: undefined,
    status: 'scheduled',
    autoApply: false,
    metadata: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hook pour récupérer les services
  const { data: servicesData } = useGetPressingServicesQuery();

  // Initialiser le formulaire avec les données de la promotion existante
  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description,
        code: promotion.code || '',
        type: promotion.type,
        value: promotion.value || 0,
        trialDays: promotion.trialDays || 0,
        buyX: promotion.buyX || 1,
        getY: promotion.getY || 1,
        maxUses: promotion.maxUses,
        validFrom: promotion.validFrom.split('T')[0],
        validUntil: promotion.validUntil ? promotion.validUntil.split('T')[0] : '',
        target: promotion.target,
        services: promotion.services || [],
        minimumOrderAmount: promotion.minimumOrderAmount,
        maximumDiscount: promotion.maximumDiscount,
        status: promotion.status,
        autoApply: promotion.autoApply,
        metadata: promotion.metadata || {},
      });
    } else {
      // Réinitialiser pour une nouvelle promotion
      setFormData({
        name: '',
        description: '',
        code: '',
        type: 'percentage',
        value: 0,
        trialDays: 0,
        buyX: 1,
        getY: 1,
        maxUses: undefined,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        target: {
          type: 'all',
          users: [],
          pressings: [],
        },
        services: [],
        minimumOrderAmount: undefined,
        maximumDiscount: undefined,
        status: 'scheduled',
        autoApply: false,
        metadata: {},
      });
    }
    setErrors({});
  }, [promotion]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (formData.type !== 'free_trial' && (!formData.value || formData.value <= 0)) {
      newErrors.value = 'La valeur doit être supérieure à 0';
    }

    if (formData.type === 'free_trial' && (!formData.trialDays || formData.trialDays <= 0)) {
      newErrors.trialDays = 'Le nombre de jours doit être supérieur à 0';
    }

    if (formData.type === 'buy_x_get_y') {
      if (!formData.buyX || formData.buyX <= 0) {
        newErrors.buyX = 'Le nombre d\'articles à acheter doit être supérieur à 0';
      }
      if (!formData.getY || formData.getY <= 0) {
        newErrors.getY = 'Le nombre d\'articles gratuits doit être supérieur à 0';
      }
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'La date de début est requise';
    }

    if (formData.validUntil && formData.validFrom && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      newErrors.validUntil = 'La date de fin doit être postérieure à la date de début';
    }

    if (formData.maxUses && formData.maxUses <= 0) {
      newErrors.maxUses = 'Le nombre maximum d\'utilisations doit être supérieur à 0';
    }

    if (formData.minimumOrderAmount && formData.minimumOrderAmount < 0) {
      newErrors.minimumOrderAmount = 'Le montant minimum ne peut pas être négatif';
    }

    if (formData.maximumDiscount && formData.maximumDiscount < 0) {
      newErrors.maximumDiscount = 'La réduction maximum ne peut pas être négative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaire de soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Gestionnaire de changement de champ
  const handleChange = (field: keyof PromotionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {promotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la promotion *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Réduction de printemps"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code promo (optionnel)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: SPRING2024"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour générer automatiquement
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Décrivez votre promotion..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Type et valeur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de promotion *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as PromotionFormData['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Pourcentage de réduction</option>
                <option value="fixed_amount">Montant fixe de réduction</option>
                <option value="free_trial">Essai gratuit</option>
                <option value="buy_x_get_y">Achetez X obtenez Y</option>
              </select>
            </div>

            {/* Champs conditionnels selon le type */}
            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pourcentage de réduction (%) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.value || ''}
                  onChange={(e) => handleChange('value', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 20"
                />
                {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
              </div>
            )}

            {formData.type === 'fixed_amount' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de réduction (FCFA) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.value || ''}
                  onChange={(e) => handleChange('value', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 5000"
                />
                {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
              </div>
            )}

            {formData.type === 'free_trial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de jours gratuits *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.trialDays || ''}
                  onChange={(e) => handleChange('trialDays', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.trialDays ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 7"
                />
                {errors.trialDays && <p className="text-red-500 text-sm mt-1">{errors.trialDays}</p>}
              </div>
            )}

            {formData.type === 'buy_x_get_y' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre à acheter *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.buyX || ''}
                    onChange={(e) => handleChange('buyX', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.buyX ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 2"
                  />
                  {errors.buyX && <p className="text-red-500 text-sm mt-1">{errors.buyX}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre gratuit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.getY || ''}
                    onChange={(e) => handleChange('getY', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.getY ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 1"
                  />
                  {errors.getY && <p className="text-red-500 text-sm mt-1">{errors.getY}</p>}
                </div>
              </>
            )}
          </div>

          {/* Dates de validité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleChange('validFrom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.validFrom ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin (optionnel)
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleChange('validUntil', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.validUntil ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>}
            </div>
          </div>

          {/* Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum d'utilisations (optionnel)
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses || ''}
                onChange={(e) => handleChange('maxUses', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maxUses ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: 100"
              />
              {errors.maxUses && <p className="text-red-500 text-sm mt-1">{errors.maxUses}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant minimum de commande (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minimumOrderAmount || ''}
                onChange={(e) => handleChange('minimumOrderAmount', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.minimumOrderAmount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: 10000"
              />
              {errors.minimumOrderAmount && <p className="text-red-500 text-sm mt-1">{errors.minimumOrderAmount}</p>}
            </div>
          </div>

          {/* Réduction maximum pour les pourcentages */}
          {formData.type === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Réduction maximum (FCFA) - optionnel
              </label>
              <input
                type="number"
                min="0"
                value={formData.maximumDiscount || ''}
                onChange={(e) => handleChange('maximumDiscount', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maximumDiscount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: 50000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limite la réduction maximale pour les pourcentages
              </p>
              {errors.maximumDiscount && <p className="text-red-500 text-sm mt-1">{errors.maximumDiscount}</p>}
            </div>
          )}

          {/* Cible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cible de la promotion
            </label>
            <select
              value={formData.target.type}
              onChange={(e) => handleChange('target', { ...formData.target, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les clients</option>
              <option value="new_users">Nouveaux clients uniquement</option>
              <option value="existing_users">Clients existants uniquement</option>
            </select>
          </div>

          {/* Statut et options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut initial
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as PromotionFormData['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="scheduled">Programmée</option>
                <option value="active">Active</option>
                <option value="paused">En pause</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoApply"
                checked={formData.autoApply}
                onChange={(e) => handleChange('autoApply', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoApply" className="ml-2 block text-sm text-gray-700">
                Application automatique
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Sauvegarde...' : (promotion ? 'Mettre à jour' : 'Créer la promotion')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionEditor;
