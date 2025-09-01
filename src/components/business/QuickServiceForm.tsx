import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, Clock, DollarSign, Tag, FileText, Eye, EyeOff } from 'lucide-react';
import { useCreateServiceMutation } from '../../services/pressingApi';

interface QuickServiceFormProps {
  onSave: (serviceData: any) => void;
  onCancel: () => void;
}

const QuickServiceForm: React.FC<QuickServiceFormProps> = ({ onSave, onCancel }) => {
  const [createService, { isLoading: isSubmitting }] = useCreateServiceMutation();
  
  const [formData, setFormData] = useState({
    nom: '',
    categorie: 'nettoyage',
    prix: '',
    dureeMoyenne: 24,
    description: '',
    disponible: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'nettoyage', label: 'Nettoyage à sec', icon: '🧽', color: 'bg-blue-100 text-blue-800' },
    { value: 'lavage', label: 'Lavage', icon: '💧', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'repassage', label: 'Repassage', icon: '👔', color: 'bg-purple-100 text-purple-800' },
    { value: 'retouche', label: 'Retouches', icon: '✂️', color: 'bg-orange-100 text-orange-800' },
    { value: 'special', label: 'Service spécial', icon: '⭐', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const durations = [
    { value: 2, label: '2h - Express', icon: '⚡', description: 'Service ultra-rapide', color: 'text-red-600' },
    { value: 4, label: '4h - Rapide', icon: '🚀', description: 'Service rapide', color: 'text-orange-600' },
    { value: 24, label: '24h - Standard', icon: '📅', description: 'Service standard', color: 'text-blue-600' },
    { value: 48, label: '48h - Normal', icon: '🕐', description: 'Service normal', color: 'text-green-600' },
    { value: 72, label: '72h - Économique', icon: '💰', description: 'Service économique', color: 'text-purple-600' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du service est obligatoire';
    } else if (formData.nom.trim().length < 3) {
      newErrors.nom = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.prix || parseInt(formData.prix) <= 0) {
      newErrors.prix = 'Le prix doit être supérieur à 0';
    } else if (parseInt(formData.prix) > 100000) {
      newErrors.prix = 'Le prix ne peut pas dépasser 100 000 FCFA';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const serviceData = {
        ...formData,
        prix: parseInt(formData.prix) || 0
      };
      
      // Create service via API
      const result = await createService(serviceData).unwrap();
      
      toast.success('🎉 Service créé avec succès !');
      
      // Call prop callback with the created service
      onSave(result);
      
      // Close form after successful save
      onCancel();
    } catch (error) {
      console.error('Erreur lors de la création du service:', error);
      toast.error('Erreur lors de la création du service');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedCategory = categories.find(cat => cat.value === formData.categorie);
  const selectedDuration = durations.find(dur => dur.value === formData.dureeMoyenne);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Name */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700">
          <Tag className="w-4 h-4 mr-2 text-blue-500" />
          Nom du service *
        </label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => handleChange('nom', e.target.value)}
          placeholder="Ex: Costume 2 pièces, Robe de soirée..."
          className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
            errors.nom 
              ? 'border-red-300 focus:ring-red-500 bg-red-50' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400'
          }`}
          maxLength={50}
        />
        {errors.nom && (
          <p className="text-red-600 text-sm flex items-center">
            <X className="w-4 h-4 mr-1" />
            {errors.nom}
          </p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.nom.length}/50 caractères
        </p>
      </div>

      {/* Category Selection - Mobile Optimized */}
      <div className="space-y-3">
        <label className="flex items-center text-sm font-semibold text-gray-700">
          <span className="mr-2">🏷️</span>
          Catégorie de service *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map(category => (
            <button
              key={category.value}
              type="button"
              onClick={() => handleChange('categorie', category.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                formData.categorie === category.value
                  ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{category.label}</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${category.color}`}>
                    Catégorie
                  </div>
                </div>
                {formData.categorie === category.value && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Price and Duration - Mobile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <DollarSign className="w-4 h-4 mr-2 text-green-500" />
            Prix (FCFA) *
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.prix}
              onChange={(e) => handleChange('prix', e.target.value)}
              placeholder="2000"
              min="100"
              max="100000"
              step="100"
              className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.prix 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400'
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
              FCFA
            </div>
          </div>
          {errors.prix && (
            <p className="text-red-600 text-sm flex items-center">
              <X className="w-4 h-4 mr-1" />
              {errors.prix}
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-purple-500" />
            Durée de traitement *
          </label>
          <select
            value={formData.dureeMoyenne}
            onChange={(e) => handleChange('dureeMoyenne', parseInt(e.target.value))}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400 transition-all duration-200"
          >
            {durations.map(duration => (
              <option key={duration.value} value={duration.value}>
                {duration.icon} {duration.label}
              </option>
            ))}
          </select>
          {selectedDuration && (
            <p className={`text-sm ${selectedDuration.color} flex items-center`}>
              <span className="mr-1">{selectedDuration.icon}</span>
              {selectedDuration.description}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700">
          <FileText className="w-4 h-4 mr-2 text-gray-500" />
          Description (optionnel)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Décrivez les spécificités de ce service, les matières acceptées, les options disponibles..."
          rows={3}
          maxLength={200}
          className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
            errors.description 
              ? 'border-red-300 focus:ring-red-500 bg-red-50' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400'
          }`}
        />
        {errors.description && (
          <p className="text-red-600 text-sm flex items-center">
            <X className="w-4 h-4 mr-1" />
            {errors.description}
          </p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.description.length}/200 caractères
        </p>
      </div>

      {/* Service Status */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {formData.disponible ? (
              <Eye className="w-5 h-5 text-green-500" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <div className="font-medium text-gray-900">
                Statut du service
              </div>
              <div className="text-sm text-gray-600">
                {formData.disponible ? 'Visible pour les clients' : 'Masqué aux clients'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChange('disponible', !formData.disponible)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              formData.disponible ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.disponible ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action Buttons - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Création en cours...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Créer le service
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="sm:w-32 inline-flex items-center justify-center min-h-[48px] px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
        >
          <X className="w-5 h-5 mr-2 sm:mr-0 sm:hidden" />
          <span className="sm:hidden">Annuler</span>
          <span className="hidden sm:inline">Annuler</span>
        </button>
      </div>

      {/* Service Preview */}
      {formData.nom && formData.prix && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">{selectedCategory?.icon}</span>
            <h4 className="font-semibold text-gray-900">Aperçu du service</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nom:</span>
              <span className="font-medium">{formData.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prix:</span>
              <span className="font-medium text-green-600">{parseInt(formData.prix).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Durée:</span>
              <span className="font-medium">{selectedDuration?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <span className={`font-medium ${formData.disponible ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.disponible ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default QuickServiceForm;
