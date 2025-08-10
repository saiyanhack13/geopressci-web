import React from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Users, Tag, Percent, Gift, Clock } from 'lucide-react';
import { Promotion } from '../../services/pressingApi';
import Button from '../ui/Button';

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  // Fonction pour formater la valeur de la promotion
  const formatPromotionValue = () => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}%`;
      case 'fixed_amount':
        return `${promotion.value} FCFA`;
      case 'free_trial':
        return `${promotion.trialDays} jours gratuits`;
      case 'buy_x_get_y':
        return `Achetez ${promotion.buyX}, obtenez ${promotion.getY}`;
      default:
        return 'N/A';
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = () => {
    switch (promotion.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-orange-100 text-orange-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir l'icône du type
  const getTypeIcon = () => {
    switch (promotion.type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed_amount':
        return <Tag className="w-4 h-4" />;
      case 'free_trial':
        return <Clock className="w-4 h-4" />;
      case 'buy_x_get_y':
        return <Gift className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculer le pourcentage d'utilisation
  const usagePercentage = promotion.maxUses 
    ? Math.round((promotion.currentUses / promotion.maxUses) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {getTypeIcon()}
              <h3 className="text-lg font-semibold text-gray-900 ml-2 truncate">
                {promotion.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {promotion.description}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {promotion.status === 'active' && 'Active'}
              {promotion.status === 'scheduled' && 'Programmée'}
              {promotion.status === 'paused' && 'En pause'}
              {promotion.status === 'expired' && 'Expirée'}
              {promotion.status === 'deleted' && 'Supprimée'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4">
        {/* Valeur de la promotion */}
        <div className="mb-4">
          <div className="text-center bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">
              {formatPromotionValue()}
            </div>
            <div className="text-sm text-blue-500 mt-1">
              Réduction
            </div>
          </div>
        </div>

        {/* Code promo */}
        {promotion.code && (
          <div className="mb-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <span className="text-sm text-gray-600">Code promo :</span>
              <span className="font-mono font-bold text-gray-900 bg-white px-2 py-1 rounded border">
                {promotion.code}
              </span>
            </div>
          </div>
        )}

        {/* Informations sur les dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Du {formatDate(promotion.validFrom)}</span>
            {promotion.validUntil && (
              <span> au {formatDate(promotion.validUntil)}</span>
            )}
          </div>
        </div>

        {/* Utilisation */}
        {promotion.maxUses && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Utilisations</span>
              <span>{promotion.currentUses} / {promotion.maxUses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Montant minimum */}
        {promotion.minimumOrderAmount && (
          <div className="text-sm text-gray-600 mb-4">
            <span>Commande minimum : {promotion.minimumOrderAmount} FCFA</span>
          </div>
        )}

        {/* Cible */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Users className="w-4 h-4 mr-2" />
          <span>
            {promotion.target.type === 'all' && 'Tous les clients'}
            {promotion.target.type === 'new_users' && 'Nouveaux clients'}
            {promotion.target.type === 'existing_users' && 'Clients existants'}
            {promotion.target.type === 'specific_users' && 'Clients spécifiques'}
            {promotion.target.type === 'specific_pressings' && 'Pressings spécifiques'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
          
          {/* Toggle statut */}
          {(promotion.status === 'active' || promotion.status === 'paused') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleStatus}
              className={`${
                promotion.status === 'active'
                  ? 'text-orange-600 border-orange-200 hover:bg-orange-50'
                  : 'text-green-600 border-green-200 hover:bg-green-50'
              }`}
            >
              {promotion.status === 'active' ? (
                <>
                  <ToggleLeft className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 mr-1" />
                  Activer
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionCard;
