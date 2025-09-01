import React, { useState } from 'react';
import { Camera, Upload, X, Eye, Trash2, Edit, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  useGetPressingPhotosQuery,
  useUploadGalleryPhotoMutation,
  useDeletePhotoMutation,
  useSetPrimaryPhotoMutation
} from '../../services/pressingApi';

interface Photo {
  id: string;
  url: string;
  alt: string;
  description?: string;
  isMain?: boolean;
  uploadedAt: string;
}

interface PhotoGalleryProps {
  pressingId: string;
  photos?: Photo[];
  isOwner?: boolean;
  onUploadPhoto?: (file: File, description?: string) => Promise<void>;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  onSetMainPhoto?: (photoId: string) => Promise<void>;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  pressingId,
  photos = [],
  isOwner = false,
  onUploadPhoto,
  onDeletePhoto,
  onSetMainPhoto
}) => {
  // Real API hooks
  const { data: apiPhotos, isLoading, error, refetch } = useGetPressingPhotosQuery(pressingId);
  const [uploadGalleryPhoto, { isLoading: isUploading }] = useUploadGalleryPhotoMutation();
  const [deletePhoto] = useDeletePhotoMutation();
  const [setPrimaryPhoto] = useSetPrimaryPhotoMutation();
  
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');

  // Mock photos for demonstration
  const mockPhotos: Photo[] = [
    {
      id: '1',
      url: '/api/placeholder/600/400',
      alt: 'Façade du pressing',
      description: 'Vue extérieure de notre pressing moderne',
      isMain: true,
      uploadedAt: '2024-08-25T10:00:00Z'
    },
    {
      id: '2',
      url: '/api/placeholder/600/400',
      alt: 'Intérieur pressing',
      description: 'Espace d\'accueil clients',
      uploadedAt: '2024-08-24T14:30:00Z'
    },
    {
      id: '3',
      url: '/api/placeholder/600/400',
      alt: 'Équipement professionnel',
      description: 'Machines de nettoyage à sec dernière génération',
      uploadedAt: '2024-08-23T09:15:00Z'
    },
    {
      id: '4',
      url: '/api/placeholder/600/400',
      alt: 'Zone de repassage',
      description: 'Atelier de repassage professionnel',
      uploadedAt: '2024-08-22T16:45:00Z'
    },
    {
      id: '5',
      url: '/api/placeholder/600/400',
      alt: 'Équipe pressing',
      description: 'Notre équipe de professionnels',
      uploadedAt: '2024-08-21T11:20:00Z'
    },
    {
      id: '6',
      url: '/api/placeholder/600/400',
      alt: 'Vêtements traités',
      description: 'Exemples de nos services de qualité',
      uploadedAt: '2024-08-20T13:10:00Z'
    }
  ];

  // Normalize photo data from API
  const normalizePhoto = (photo: any): Photo => ({
    id: photo._id || photo.id || '',
    url: photo.url || photo.optimizedUrl || '',
    alt: photo.caption || photo.alt || 'Photo du pressing',
    description: photo.caption || photo.description,
    isMain: photo.isPrimary || photo.isMain || false,
    uploadedAt: photo.uploadedAt || new Date().toISOString()
  });

  // Use real API data or fallback to mock/props data
  const rawPhotos = apiPhotos?.gallery || photos || mockPhotos;
  const allPhotos = rawPhotos.map(normalizePhoto);
  const mainPhoto = allPhotos.find(photo => photo.isMain) || allPhotos[0];

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-red-600 mb-4">
          <X className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm text-gray-600 mt-1">Impossible de charger les photos</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La photo ne doit pas dépasser 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }
      setUploadFile(file);
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    try {
      const formData = new FormData();
      formData.append('photo', uploadFile);
      if (uploadDescription) {
        formData.append('caption', uploadDescription);
      }

      await uploadGalleryPhoto(formData).unwrap();
      
      toast.success('Photo ajoutée avec succès !');
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadDescription('');
      refetch(); // Refresh photos
      
      // Call prop callback if provided
      if (onUploadPhoto) {
        await onUploadPhoto(uploadFile, uploadDescription);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erreur lors de l\'ajout de la photo');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      try {
        await deletePhoto({ pressingId, photoId }).unwrap();
        toast.success('Photo supprimée');
        refetch(); // Refresh photos
        
        // Call prop callback if provided
        if (onDeletePhoto) {
          await onDeletePhoto(photoId);
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleSetMain = async (photoId: string) => {
    try {
      await setPrimaryPhoto({ pressingId, photoId }).unwrap();
      toast.success('Photo principale mise à jour');
      refetch(); // Refresh photos
      
      // Call prop callback if provided
      if (onSetMainPhoto) {
        await onSetMainPhoto(photoId);
      }
    } catch (error) {
      console.error('Error setting main photo:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (allPhotos.length === 0 && !isOwner) {
    return (
      <div className="text-center py-12">
        <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Aucune photo disponible
        </h3>
        <p className="text-gray-600">
          Ce pressing n'a pas encore ajouté de photos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Galerie photos
          </h2>
          <p className="text-gray-600 mt-1">
            {allPhotos.length} photo{allPhotos.length > 1 ? 's' : ''}
          </p>
        </div>
        
        {isOwner && (
          <div className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
            >
              <Upload className="w-5 h-5 mr-2" />
              Ajouter une photo
            </label>
          </div>
        )}
      </div>

      {/* Main Photo */}
      {mainPhoto && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative">
            <img
              src={mainPhoto.url}
              alt={mainPhoto.alt}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover cursor-pointer"
              onClick={() => setSelectedPhoto(mainPhoto)}
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                <Camera className="w-4 h-4 mr-1" />
                Photo principale
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h3 className="text-white font-semibold text-lg mb-1">
                {mainPhoto.description || mainPhoto.alt}
              </h3>
              <p className="text-white/80 text-sm">
                Ajoutée le {formatDate(mainPhoto.uploadedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {allPhotos.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {allPhotos.filter(photo => !photo.isMain).map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all duration-200"
            >
              <div className="relative">
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="w-full h-32 sm:h-40 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                  onClick={() => setSelectedPhoto(photo)}
                />
                
                {/* Overlay with actions */}
                {isOwner && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSetMain(photo.id)}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="Définir comme photo principale"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="Voir en grand"
                      >
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
                  {photo.description || photo.alt}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatDate(photo.uploadedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State for Owner */}
      {allPhotos.length === 0 && isOwner && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ajoutez vos premières photos
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Montrez votre pressing sous son meilleur jour ! Ajoutez des photos de votre façade, de vos équipements et de vos services.
          </p>
          <label
            htmlFor="photo-upload-empty"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter la première photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload-empty"
          />
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && uploadFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ajouter une photo
                </h3>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="mb-4">
                <img
                  src={URL.createObjectURL(uploadFile)}
                  alt="Aperçu"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Ex: Vue de la façade, équipement professionnel..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadDescription.length}/100 caractères
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 inline-flex items-center justify-center py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Ajouter
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <h3 className="text-xl font-semibold">
                  {selectedPhoto.description || selectedPhoto.alt}
                </h3>
                <p className="text-white/70">
                  Ajoutée le {formatDate(selectedPhoto.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-white/70 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.alt}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            
            {isOwner && (
              <div className="flex justify-center space-x-4 mt-4">
                {!selectedPhoto.isMain && (
                  <button
                    onClick={() => handleSetMain(selectedPhoto.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4 mr-2 inline" />
                    Photo principale
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
