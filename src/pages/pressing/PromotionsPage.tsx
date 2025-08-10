import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Calendar, Percent, Gift, Users, Tag } from 'lucide-react';
import { 
  useGetPromotionsQuery, 
  useCreatePromotionMutation, 
  useUpdatePromotionMutation, 
  useDeletePromotionMutation,
  useUpdatePromotionStatusMutation,
  Promotion,
  PromotionFormData
} from '../../services/pressingApi';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import PromotionEditor from '../../components/business/PromotionEditor';
import PromotionCard from '../../components/business/PromotionCard';

type FilterStatus = 'all' | 'active' | 'scheduled' | 'expired' | 'paused' | 'deleted';
type FilterType = 'all' | 'percentage' | 'fixed_amount' | 'free_trial' | 'buy_x_get_y';
type SortBy = 'name' | 'createdAt' | 'validFrom' | 'validUntil' | 'currentUses';

const PromotionsPage: React.FC = () => {
  // États pour les filtres et pagination
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Hooks API
  const { 
    data: promotionsData, 
    isLoading, 
    error, 
    refetch 
  } = useGetPromotionsQuery({
    page: currentPage,
    limit: 12,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    type: filterType !== 'all' ? filterType : undefined,
    search: searchQuery || undefined,
  });

  const [createPromotion, { isLoading: isCreating }] = useCreatePromotionMutation();
  const [updatePromotion, { isLoading: isUpdating }] = useUpdatePromotionMutation();
  const [deletePromotion, { isLoading: isDeleting }] = useDeletePromotionMutation();
  const [updatePromotionStatus] = useUpdatePromotionStatusMutation();

  // Gestionnaires d'événements
  const handleCreatePromotion = () => {
    setEditingPromotion(null);
    setIsEditing(false);
    setShowEditor(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setIsEditing(true);
    setShowEditor(true);
  };

  const handleDeletePromotion = async (promotionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      try {
        await deletePromotion(promotionId).unwrap();
        toast.success('Promotion supprimée avec succès');
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la promotion');
      }
    }
  };

  const handleToggleStatus = async (promotionId: string, currentStatus: Promotion['status']) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updatePromotionStatus({ id: promotionId, status: newStatus }).unwrap();
      toast.success(`Promotion ${newStatus === 'active' ? 'activée' : 'mise en pause'}`);
      refetch();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleSavePromotion = async (promotionData: PromotionFormData) => {
    try {
      if (isEditing && editingPromotion) {
        await updatePromotion({ 
          id: editingPromotion._id, 
          data: promotionData 
        }).unwrap();
        toast.success('Promotion mise à jour avec succès');
      } else {
        await createPromotion(promotionData).unwrap();
        toast.success('Promotion créée avec succès');
      }
      setShowEditor(false);
      setEditingPromotion(null);
      refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de la promotion');
    }
  };

  // Filtrage et tri des promotions
  const filteredPromotions = promotionsData?.promotions || [];

  // Statistiques
  const stats = {
    total: promotionsData?.total || 0,
    active: filteredPromotions.filter(p => p.status === 'active').length,
    scheduled: filteredPromotions.filter(p => p.status === 'scheduled').length,
    expired: filteredPromotions.filter(p => p.status === 'expired').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">Erreur lors du chargement des promotions</div>
        <Button onClick={() => refetch()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Promotions
            </h1>
            <p className="text-gray-600">
              Créez et gérez vos offres promotionnelles pour attirer plus de clients
            </p>
          </div>
          <Button 
            onClick={handleCreatePromotion}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Promotion
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Gift className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <ToggleRight className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Programmées</p>
                <p className="text-2xl font-bold text-orange-600">{stats.scheduled}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <ToggleLeft className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Expirées</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher une promotion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bouton filtres */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Filtres étendus */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="scheduled">Programmées</option>
                <option value="paused">En pause</option>
                <option value="expired">Expirées</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="percentage">Pourcentage</option>
                <option value="fixed_amount">Montant fixe</option>
                <option value="free_trial">Essai gratuit</option>
                <option value="buy_x_get_y">Achetez X obtenez Y</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Date de création</option>
                <option value="name">Nom</option>
                <option value="validFrom">Date de début</option>
                <option value="validUntil">Date de fin</option>
                <option value="currentUses">Utilisations</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Liste des promotions */}
      {filteredPromotions.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune promotion trouvée
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all' || filterType !== 'all'
              ? 'Aucune promotion ne correspond à vos critères de recherche.'
              : 'Commencez par créer votre première promotion pour attirer plus de clients.'}
          </p>
          {(!searchQuery && filterStatus === 'all' && filterType === 'all') && (
            <Button onClick={handleCreatePromotion} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première promotion
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promotion) => (
            <PromotionCard
              key={promotion._id}
              promotion={promotion}
              onEdit={() => handleEditPromotion(promotion)}
              onDelete={() => handleDeletePromotion(promotion._id)}
              onToggleStatus={() => handleToggleStatus(promotion._id, promotion.status)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {promotionsData && promotionsData.total > 12 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} sur {Math.ceil(promotionsData.total / 12)}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(promotionsData.total / 12)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditor && (
        <PromotionEditor
          promotion={editingPromotion}
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditingPromotion(null);
          }}
          onSave={handleSavePromotion}
          isLoading={isCreating || isUpdating}
        />
      )}
    </div>
  );
};

export default PromotionsPage;
