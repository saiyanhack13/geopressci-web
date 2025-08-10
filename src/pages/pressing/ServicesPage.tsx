import React, { useState } from 'react';
import ServiceEditor from '../../components/business/ServiceEditor';
import KPICard from '../../components/business/KPICard';
import { 
  useGetPressingServicesQuery, 
  useGetServiceQuery,
  useUpdateServiceMutation, 
  useCreateServiceMutation, 
  useDeleteServiceMutation,
  useToggleServiceAvailabilityMutation,
  PressingService 
} from '../../services/pressingApi';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-hot-toast';

// Interface étendue avec compatibilité pour les champs en français/anglais
type Service = Omit<PressingService, 'id' | 'name' | 'price' | 'category' | 'duration' | 'isAvailable'> & {
  // Champs de base
  _id: string;
  id?: string; // Compatibilité
  nom: string;
  name?: string; // Alias pour nom
  prix: number;
  price?: number; // Alias pour prix
  categorie: string;
  category?: string; // Alias pour categorie
  dureeMoyenne: number;
  duration?: number; // Alias pour dureeMoyenne
  disponible: boolean;
  isAvailable?: boolean; // Alias pour disponible
  
  // Champs optionnels
  description?: string;
  validite?: number;
  options?: any[];
  images?: string[];
  popularity?: number;
  revenue?: number; // revenus générés (calculé côté frontend)
  
  // Pour la compatibilité avec l'ancien format
  [key: string]: any;
};

type FilterCategory = 'tous' | 'nettoyage' | 'lavage' | 'repassage' | 'retouche' | 'special';
type SortBy = 'name' | 'price' | 'popularity' | 'revenue';

const ServicesPage: React.FC = () => {
  // États pour les filtres et pagination
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('tous');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  
  // Hooks API pour récupérer les données réelles
  const { 
    data: servicesData, 
    isLoading, 
    error, 
    refetch 
  } = useGetPressingServicesQuery();
  
  const [updateService] = useUpdateServiceMutation();
  const [createService] = useCreateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const [toggleServiceAvailability] = useToggleServiceAvailabilityMutation();

  // Utiliser les données réelles de l'API ou fallback sur mock
  const services = (servicesData || []) as Service[];
  const totalServicesCount = services.length;

  // Fonction utilitaire pour obtenir une valeur de service en toute sécurité
  const getServiceValue = (service: Service, key: string): any => {
    // Gestion des alias de champs (français/anglais)
    const fieldMap: Record<string, string> = {
      name: 'nom',
      price: 'prix',
      category: 'categorie',
      duration: 'dureeMoyenne',
      isAvailable: 'disponible'
    };
    
    const field = fieldMap[key] || key;
    return service[field] ?? service[key];
  };

  // Filtrer et trier les services côté client
  const filteredServices = services
    .filter((service) => {
      const serviceCategory = getServiceValue(service, 'category');
      const serviceName = getServiceValue(service, 'name') || '';
      const serviceDesc = service.description || '';
      
      const matchesCategory = filterCategory === 'tous' || serviceCategory === filterCategory;
      const matchesSearch = searchTerm === '' || 
        serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        serviceDesc.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = getServiceValue(a, sortBy);
      const bValue = getServiceValue(b, sortBy);
      
      // Valeurs par défaut pour le tri
      const defaultValues: Record<string, any> = {
        name: '',
        price: 0,
        popularity: 0,
        revenue: 0,
        category: ''
      };
      
      const aSafe = aValue ?? defaultValues[sortBy] ?? 0;
      const bSafe = bValue ?? defaultValues[sortBy] ?? 0;
      
      // Tri en fonction du type de la valeur
      if (typeof aSafe === 'string' && typeof bSafe === 'string') {
        return aSafe.localeCompare(bSafe);
      }
      
      return (bSafe as number) - (aSafe as number);
    });

  const categories = [
    { value: 'tous', label: '📊 Tous les services', icon: '📊' },
    { value: 'nettoyage', label: '🧽 Nettoyage à sec', icon: '🧽' },
    { value: 'lavage', label: '💧 Lavage', icon: '💧' },
    { value: 'repassage', label: '👔 Repassage', icon: '👔' },
    { value: 'retouche', label: '✂️ Retouches', icon: '✂️' },
    { value: 'special', label: '⭐ Services spéciaux', icon: '⭐' }
  ];

  // Statistiques
  const activeServices = services.filter((s) => getServiceValue(s, 'isAvailable')).length;
  const totalRevenue = services.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalPrices = services.reduce((sum, s) => sum + (Number(getServiceValue(s, 'price')) || 0), 0);
  const avgPrice = totalServicesCount > 0 ? totalPrices / totalServicesCount : 0;
  const totalOrders = services.reduce((sum, s) => sum + (s.popularity || 0), 0);

  // Comptage des services par catégorie
  const categoryCounts = {
    tous: totalServicesCount,
    nettoyage: services.filter((s) => getServiceValue(s, 'category') === 'nettoyage').length,
    lavage: services.filter((s) => getServiceValue(s, 'category') === 'lavage').length,
    repassage: services.filter((s) => getServiceValue(s, 'category') === 'repassage').length,
    retouche: services.filter((s) => getServiceValue(s, 'category') === 'retouche').length,
    special: services.filter((s) => getServiceValue(s, 'category') === 'special').length
  };

  const handleSaveService = async (serviceData: any) => {
    // Debug: Log des données brutes reçues du ServiceEditor
    console.log('📝 Données brutes du ServiceEditor:', serviceData);
    
    // Adapter les données du ServiceEditor vers notre format backend
    const adaptedData = {
      // Mappage des champs ServiceEditor (anglais) vers backend (français)
      nom: serviceData.name || '',
      description: serviceData.description || '',
      prix: Number(serviceData.price) || 0,
      categorie: serviceData.category || 'nettoyage',
      dureeMoyenne: Number(serviceData.duration) || 24,
      disponible: serviceData.isActive ?? true,
      // Champs optionnels avec valeurs par défaut
      validite: 30,
      options: [],
      images: [],
      // Préserver les champs existants si présents
      ...(editingService?.id && { _id: editingService.id }),
      ...(editingService?.createdAt && { createdAt: editingService.createdAt })
    };
    
    // Debug: Log des données adaptées
    console.log('📝 Données service adaptées:', adaptedData);
    
    // Validation des champs requis
    if (!adaptedData.nom || !adaptedData.description || !adaptedData.prix || !adaptedData.categorie) {
      console.error('❌ Validation échouée:', {
        nom: adaptedData.nom,
        description: adaptedData.description,
        prix: adaptedData.prix,
        categorie: adaptedData.categorie
      });
      toast.error('Nom, description, prix et catégorie sont requis');
      return;
    }
    
    try {
      if (editingService?._id) {
        // Modifier un service existant
        await updateService({ 
          serviceId: editingService._id, 
          updates: {
            nom: adaptedData.nom,
            description: adaptedData.description,
            prix: adaptedData.prix,
            categorie: adaptedData.categorie,
            dureeMoyenne: adaptedData.dureeMoyenne,
            disponible: adaptedData.disponible,
            // Préserver les champs optionnels s'ils existent
            ...(adaptedData.validite !== undefined && { validite: adaptedData.validite }),
            ...(adaptedData.options && { options: adaptedData.options }),
            ...(adaptedData.images && { images: adaptedData.images })
          }
        }).unwrap();
        toast.success('Service modifié avec succès');
      } else {
        // Créer un nouveau service avec des valeurs par défaut
        const newService = {
          nom: adaptedData.nom,
          description: adaptedData.description || '',
          prix: adaptedData.prix,
          categorie: adaptedData.categorie,
          dureeMoyenne: adaptedData.dureeMoyenne,
          disponible: adaptedData.disponible,
          // Valeurs par défaut pour les champs optionnels
          validite: adaptedData.validite || 30, // 30 jours par défaut
          options: adaptedData.options || [],
          images: adaptedData.images || [],
          popularity: 0,
          revenue: 0
        };
        
        await createService(newService as any).unwrap();
        toast.success('Service créé avec succès');
      }
      
      setEditingService(undefined);
      setShowEditor(false);
      refetch(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du service:', error);
      toast.error('Erreur lors de la sauvegarde du service');
    }
  };

  const handleEditService = (service: Service) => {
    // Créer une copie du service avec les champs mappés pour l'édition
    const serviceToEdit = {
      ...service,
      // Mapper les champs français vers anglais pour le formulaire d'édition
      name: service.nom || service.name,
      price: service.prix || service.price,
      category: service.categorie || service.category,
      duration: service.dureeMoyenne || service.duration,
      isAvailable: service.disponible ?? service.isAvailable,
      // Préserver l'ID même s'il est dans _id
      id: service._id || service.id
    };
    
    setEditingService(serviceToEdit);
    setShowEditor(true);
  };

  const handleDeleteService = async (service: Service) => {
    const serviceId = service._id || service.id;
    if (!serviceId) {
      toast.error('Impossible de supprimer le service : ID manquant');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.nom || service.name || 'sans nom'}" ? Cette action est irréversible.`)) {
      try {
        await deleteService(serviceId).unwrap();
        toast.success('Service supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du service');
        console.error('Erreur suppression service:', error);
      }
    }
  };

  const handleToggleActive = async (service: Service) => {
    const serviceId = service._id || service.id;
    if (!serviceId) {
      toast.error('Impossible de modifier le statut du service : ID manquant');
      return;
    }
    
    try {
      const currentAvailability = service.disponible ?? service.isAvailable ?? false;
      await toggleServiceAvailability(serviceId).unwrap();
      toast.success(`Service ${!currentAvailability ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du service:', error);
      toast.error('Erreur lors de la mise à jour du service');
    }
  };

  const handleNewService = () => {
    setEditingService(undefined);
    setShowEditor(true);
  };

  const handleCancelEdit = () => {
    setEditingService(undefined);
    setShowEditor(false);
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📋';
  };

  const getDurationText = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Erreur lors du chargement des services:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12 sm:py-20">
            <div className="text-6xl sm:text-8xl mb-6" role="img" aria-label="Erreur">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Erreur de chargement
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Impossible de charger vos services. Veuillez réessayer plus tard.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Réessayer le chargement des services"
            >
              <span className="mr-2" role="img" aria-hidden="true">🔄</span>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header - UI/UX 2025 */}
        <header className="mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              <span className="mr-3" role="img" aria-hidden="true">🛠️</span>
              Gestion des services
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
              Gérez vos services et tarifs de pressing avec une interface moderne et intuitive
            </p>
          </div>
        </header>

        {/* Service Editor Modal */}
        {showEditor && (
          <ServiceEditor
            service={editingService ? {
              id: editingService._id || editingService.id || '',
              name: editingService.name || editingService.nom || '',
              category: editingService.category || editingService.categorie || '',
              price: editingService.price || editingService.prix || 0,
              duration: editingService.duration || editingService.dureeMoyenne || 0,
              description: editingService.description || '',
              isActive: editingService.isAvailable || editingService.disponible || false
            } : undefined}
            onSave={handleSaveService}
            onCancel={handleCancelEdit}
          />
        )}

        {/* KPIs - UI/UX 2025 */}
        <section className="mb-8 sm:mb-12" aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Statistiques des services</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Total Services</h3>
                  <span className="text-xl" role="img" aria-hidden="true">🛠️</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {services.length}
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+2 ce mois</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Services Actifs</h3>
                  <span className="text-xl" role="img" aria-hidden="true">✅</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {services.filter(s => s.disponible ?? s.isAvailable).length}
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">
                  {services.length > 0 ? Math.round((services.filter(s => s.disponible ?? s.isAvailable).length / services.length) * 100) : 0}% actifs
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Prix Moyen</h3>
                  <span className="text-xl" role="img" aria-hidden="true">💰</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  {services.length > 0 
                    ? Math.round(services.reduce(
                        (sum, service) => sum + (Number(getServiceValue(service, 'price')) || 0), 
                        0
                      ) / services.length).toLocaleString() 
                    : 0} FCFA
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+5% ce mois</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Revenus Totaux</h3>
                  <span className="text-xl" role="img" aria-hidden="true">📊</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  {services.reduce((sum, s) => sum + (s.revenue || 0), 0).toLocaleString()} FCFA
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+12% ce mois</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Controls - UI/UX 2025 */}
        <section className="mb-8" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Filtres et contrôles</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8">
              
              {/* Category Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.value}
                      onClick={() => setFilterCategory(category.value as FilterCategory)}
                      className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        filterCategory === category.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-pressed={filterCategory === category.value}
                    >
                      <span className="mr-2" role="img" aria-hidden="true">{category.icon}</span>
                      {category.label.replace(/^\S+\s/, '')}
                      <span className="ml-2 text-xs opacity-75">({categoryCounts[category.value as keyof typeof categoryCounts]})</span>
                    </button>
                  ))}
                </div>

                {/* New Service Button */}
                <button
                  onClick={handleNewService}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                  aria-label="Créer un nouveau service"
                >
                  <span className="mr-2" role="img" aria-hidden="true">➕</span>
                  <span className="hidden sm:inline">Nouveau service</span>
                  <span className="sm:hidden">Nouveau</span>
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <label htmlFor="search-services" className="sr-only">Rechercher un service</label>
                  <input
                    id="search-services"
                    type="text"
                    placeholder="Rechercher un service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" role="img" aria-hidden="true">🔍</span>
                </div>
                
                <div className="sm:w-48">
                  <label htmlFor="sort-services" className="sr-only">Trier les services</label>
                  <select
                    id="sort-services"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base bg-white"
                  >
                    <option value="popularity">📊 Trier par popularité</option>
                    <option value="revenue">💰 Trier par revenus</option>
                    <option value="price">💳 Trier par prix</option>
                    <option value="name">🔤 Trier par nom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid - UI/UX 2025 */}
        <section className="space-y-6" aria-labelledby="services-heading">
          <h2 id="services-heading" className="sr-only">Liste des services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => {
              const serviceId = service._id || service.id || '';
              const serviceName = service.nom || service.name || 'Sans nom';
              const serviceCategory = service.categorie || service.category || 'non spécifiée';
              const servicePrice = service.prix || service.price || 0;
              const serviceDuration = service.dureeMoyenne || service.duration || 0;
              const isServiceAvailable = service.disponible ?? service.isAvailable ?? true;
              const servicePopularity = service.popularity || 0;
              const serviceRevenue = service.revenue || 0;
              
              return (
                <article key={serviceId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <header className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg" role="img" aria-hidden="true">{getCategoryIcon(serviceCategory)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{serviceName}</h3>
                          <p className="text-sm text-gray-500 capitalize">{serviceCategory}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isServiceAvailable
                            ? 'text-green-600 hover:bg-green-50 focus:ring-green-500'
                            : 'text-gray-400 hover:bg-gray-50 focus:ring-gray-500'
                        }`}
                        title={isServiceAvailable ? 'Service actif - Cliquer pour désactiver' : 'Service inactif - Cliquer pour activer'}
                        aria-label={isServiceAvailable ? 'Désactiver le service' : 'Activer le service'}
                      >
                        <span role="img" aria-hidden="true">{isServiceAvailable ? '✅' : '⏸️'}</span>
                      </button>
                    </header>

                    {/* Prix et Durée */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-xs font-medium text-green-700 mb-1">Prix</p>
                        <p className="text-lg font-bold text-green-600">
                          {servicePrice.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs font-medium text-blue-700 mb-1">Délai</p>
                        <p className="text-lg font-bold text-blue-600">
                          {getDurationText(serviceDuration)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">
                      {service.description || 'Aucune description fournie'}
                    </p>

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {servicePopularity.toString()}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">Commandes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {serviceRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">Revenus FCFA</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditService(service)}
                        className="flex-1 inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        aria-label={`Modifier le service ${serviceName}`}
                      >
                        <span className="mr-2" role="img" aria-hidden="true">✏️</span>
                        <span className="text-sm">Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDeleteService(service)}
                        className="w-11 h-11 flex items-center justify-center border border-red-300 text-red-600 rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        aria-label={`Supprimer le service ${serviceName}`}
                      >
                        <span role="img" aria-hidden="true">🗑️</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          
          {/* Empty State - UI/UX 2025 */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12 sm:py-20">
              <div className="text-6xl sm:text-8xl mb-6" role="img" aria-label="Aucun service">
                {searchTerm || filterCategory !== 'tous' ? '🔍' : '🛠️'}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || filterCategory !== 'tous' ? 'Aucun service trouvé' : 'Aucun service créé'}
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || filterCategory !== 'tous'
                  ? 'Essayez de modifier vos filtres ou votre recherche pour trouver des services.'
                  : 'Commencez par créer votre premier service pour gérer votre pressing.'}
              </p>
              {(!searchTerm && filterCategory === 'tous') && (
                <button
                  onClick={handleNewService}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                  aria-label="Créer le premier service"
                >
                  <span className="mr-2" role="img" aria-hidden="true">➕</span>
                  Créer mon premier service
                </button>
              )}
            </div>
          )}
        </section>

        {/* Category Performance - UI/UX 2025 */}
        {filteredServices.length > 0 && (
          <section className="mt-8 sm:mt-12" aria-labelledby="performance-heading">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h3 id="performance-heading" className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8">
                  <span className="mr-3" role="img" aria-hidden="true">📊</span>
                  Performance par catégorie
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  {categories.slice(1).map(category => {
                    const categoryServices = services.filter(s => s.category === category.value);
                    const categoryRevenue = categoryServices.reduce((sum, s) => sum + (s.revenue || 0), 0);
                    const categoryOrders = categoryServices.reduce((sum, s) => sum + (s.popularity || 0), 0);
                    const avgCategoryPrice = categoryServices.length > 0 
                      ? categoryServices.reduce((sum, s) => sum + (s.price || s.prix || 0), 0) / categoryServices.length 
                      : 0;
                    
                    if (categoryServices.length === 0) return null;
                    
                    return (
                      <div key={category.value} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gray-50 rounded-xl gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xl" role="img" aria-hidden="true">{category.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                              {category.label.replace(/^\S+\s/, '')}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {categoryServices.length} service{categoryServices.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 sm:gap-6">
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-bold text-green-600">
                              {categoryRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600 font-medium">Revenus FCFA</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-bold text-blue-600">
                              {categoryOrders}
                            </p>
                            <p className="text-xs text-gray-600 font-medium">Commandes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-bold text-purple-600">
                              {Math.round(avgCategoryPrice).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600 font-medium">Prix moyen</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
