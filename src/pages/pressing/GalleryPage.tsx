import React, { useState } from 'react';
import { Image as ImageIcon, Video, ArrowLeft, Upload, Trash2, Plus, Star, Eye } from 'lucide-react';
import { getGalleryPlaceholder, getLogoPlaceholder } from '../../utils/placeholders';
import { 
  useGetPressingGalleryPhotosQuery, 
  useUploadGalleryPhotoMutation, 
  useUpdateGalleryPhotoMutation, 
  useDeleteGalleryPhotoMutation,
  useUploadPhotoFileMutation,
  useSetPhotoRoleMutation,
  PressingPhoto 
} from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { FileUpload } from '../../components/ui/FileUpload';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  category: 'storefront' | 'equipment' | 'results' | 'team';
  uploadDate: string;
  isCover: boolean;
  isLogo: boolean;
  views: number;
}

export const GalleryPage: React.FC = () => {
  // API hooks
  const { data: photos = [], isLoading, error, refetch: refetchPhotos } = useGetPressingGalleryPhotosQuery();
  const [uploadPhoto] = useUploadGalleryPhotoMutation();
  const [updatePhoto] = useUpdateGalleryPhotoMutation();
  const [deletePhoto] = useDeleteGalleryPhotoMutation();
  const [uploadPhotoFile] = useUploadPhotoFileMutation();
  const [setPhotoRole] = useSetPhotoRoleMutation();
  
  // Local state
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    caption: '',
    isPrimary: false
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'cover' | 'logo' | null>(null);
  
  // Fallback static data for demo (remove when real photos exist)
  const [staticMedia] = useState<MediaItem[]>([
    {
      id: '1',
      type: 'image',
      url: getGalleryPlaceholder(800, 600),
      thumbnailUrl: getGalleryPlaceholder(400, 300),
      title: 'Devanture du Pressing',
      description: 'Notre façade accueillante à Cocody.',
      category: 'storefront',
      uploadDate: '2024-01-10',
      isCover: true,
      isLogo: false,
      views: 1250
    },
    {
      id: '2',
      type: 'image',
      url: getLogoPlaceholder(150),
      thumbnailUrl: getLogoPlaceholder(150),
      title: 'Logo Officiel',
      description: 'Notre logo, symbole de qualité.',
      category: 'storefront',
      uploadDate: '2024-01-10',
      isCover: false,
      isLogo: true,
      views: 2300
    },
    {
      id: '3',
      type: 'image',
      url: getGalleryPlaceholder(800, 600),
      thumbnailUrl: getGalleryPlaceholder(400, 300),
      title: 'Nos machines de nettoyage à sec',
      description: 'Équipement moderne pour un soin optimal.',
      category: 'equipment',
      uploadDate: '2024-02-05',
      isCover: false,
      isLogo: false,
      views: 870
    },
    {
      id: '4',
      type: 'image',
      url: getGalleryPlaceholder(800, 600),
      thumbnailUrl: getGalleryPlaceholder(400, 300),
      title: 'Résultat sur une robe de soirée',
      description: 'Avant et après nettoyage.',
      category: 'results',
      uploadDate: '2024-03-15',
      isCover: false,
      isLogo: false,
      views: 1500
    },
    {
      id: '5',
      type: 'video',
      url: '#',
      thumbnailUrl: getGalleryPlaceholder(400, 300),
      title: 'Visite virtuelle du pressing',
      description: 'Découvrez nos installations en vidéo.',
      category: 'storefront',
      uploadDate: '2024-04-01',
      isCover: false,
      isLogo: false,
      views: 950
    },
    {
      id: '6',
      type: 'image',
      url: getGalleryPlaceholder(800, 600),
      thumbnailUrl: getGalleryPlaceholder(400, 300),
      title: 'Notre équipe souriante',
      description: 'Des professionnels à votre service.',
      category: 'team',
      uploadDate: '2024-05-20',
      isCover: false,
      isLogo: false,
      views: 720
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  
  // Convert API photos to display format
  const displayPhotos = photos.map((photo: PressingPhoto) => ({
    id: photo._id,
    type: 'image' as const,
    url: photo.url,
    thumbnailUrl: photo.url,
    title: photo.caption || 'Photo sans titre',
    description: photo.caption || '',
    category: photo.isPrimary ? 'storefront' as const : 'results' as const,
    uploadDate: new Date(photo.uploadedAt).toISOString().split('T')[0],
    isCover: photo.isPrimary,
    isLogo: false,
    views: 0
  }));
  
  // Combine real photos with static demo photos if no real photos exist
  const allMedia = photos.length > 0 ? displayPhotos : staticMedia;
  const filteredMedia = allMedia.filter(m => filter === 'all' || m.type === filter);

  // Handle photo upload
  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    
    setUploading(true);
    try {
      await uploadPhotoFile({
        file: uploadForm.file,
        caption: uploadForm.caption || undefined,
        isPrimary: uploadForm.isPrimary
      }).unwrap();
      
      toast.success('Photo ajoutée avec succès!');
      setShowUploadModal(false);
      setUploadForm({ file: null, caption: '', isPrimary: false });
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPhotoRole = async (photoId: string, role: 'cover' | 'logo') => {
    try {
      await setPhotoRole({ photoId, role });
      toast.success(`Photo définie comme ${role}`);
      // Récupérer les photos mises à jour
      await refetchPhotos();
    } catch (error) {
      toast.error('Erreur lors de la définition du rôle de la photo');
    }
  };

  const handleDelete = async (id: string) => {
    const photo = photos.find(p => p._id === id);
    if (photo?.isPrimary && photos.length === 1) {
      toast.error('Impossible de supprimer la seule photo primaire');
      return;
    }
    
    if (window.confirm('Supprimer cette photo ?')) {
      try {
        await deletePhoto(id).unwrap();
        toast.success('Photo supprimée avec succès!');
      } catch (error: any) {
        console.error('Erreur suppression:', error);
        toast.error(error?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleSetCover = async (id: string) => {
    try {
      await updatePhoto({
        photoId: id,
        isPrimary: true
      }).unwrap();
      toast.success('Photo définie comme couverture!');
    } catch (error: any) {
      console.error('Erreur définition couverture:', error);
      toast.error(error?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const categories = {
    storefront: 'Devanture & Intérieur',
    equipment: 'Équipements',
    results: 'Résultats',
    team: 'Équipe'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedPhoto && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              Définir comme {selectedRole === 'cover' ? 'photo de couverture' : 'logo'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Êtes-vous sûr de vouloir définir cette photo comme {selectedRole === 'cover' ? 'la photo de couverture' : 'le logo'} ?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleSetPhotoRole(selectedPhoto, selectedRole);
                  setSelectedPhoto(null);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 text-gray-500 hover:text-gray-700 touch-target"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Galerie</h1>
            </div>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base touch-target">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter un média</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-sm border border-red-200">
            <p className="text-red-600">Erreur lors du chargement des photos</p>
          </div>
        ) : (
          <>
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex rounded-lg border border-gray-300 p-1">
                    <button 
                      onClick={() => setFilter('all')} 
                      className={`px-3 py-1 rounded-md text-sm ${
                        filter === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      Tous
                    </button>
                    <button 
                      onClick={() => setFilter('image')} 
                      className={`px-3 py-1 rounded-md text-sm ${
                        filter === 'image' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      Images
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 self-center">
                  {filteredMedia.length} élément{filteredMedia.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Grille Média - Mobile Optimized */}
            {filteredMedia.length === 0 ? (
              <div className="text-center bg-white p-8 sm:p-12 rounded-lg shadow-sm border">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun média trouvé pour ces filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {filteredMedia.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
                    <div className="relative h-32 sm:h-48">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Video className="w-12 h-12 text-white" />
                    </div>
                  )}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex flex-col gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading || item.isCover || item.isLogo}
                          className="bg-white/90 p-1.5 sm:p-2 rounded-full text-red-500 hover:bg-white disabled:opacity-50 touch-target"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                  {(item.isCover || item.isLogo) && (
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {item.isCover ? 'Couverture' : 'Logo'}
                    </span>
                  )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate mb-2 hidden sm:block">{item.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate">{categories[item.category]}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Eye className="w-3 h-3" />
                          <span>{item.views}</span>
                        </div>
                      </div>
                  {item.type === 'image' && !item.isCover && !item.isLogo && (
                    <button 
                      onClick={() => handleSetCover(item.id)}
                      disabled={isLoading}
                      className="w-full mt-3 text-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-md">
                      Définir comme couverture
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPhoto(item.id);
                      setSelectedRole('cover');
                    }}
                    className={`p-2 ${item.isCover ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                  >
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPhoto(item.id);
                      setSelectedRole('logo');
                    }}
                    className={`p-2 ${item.isLogo ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section d'aide */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">💡 Conseils pour votre galerie</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📸 Qualité des photos</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Utilisez des images lumineuses et nettes.</li>
                <li>Format recommandé : JPEG ou PNG.</li>
                <li>Taille max : 5 Mo.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎥 Qualité des vidéos</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Vidéos courtes (moins de 60s).</li>
                <li>Format recommandé : MP4.</li>
                <li>Taille max : 50 Mo.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🌟 Mettez en valeur votre travail</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Montrez des photos "avant/après".</li>
                <li>Présentez votre équipe.</li>
                <li>Filmez une visite de vos locaux.</li>
              </ul>
            </div>
          </div>
        </div>
          </>
        )}
        
        {/* Modal d'upload */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Ajouter une photo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionnez votre image *
                  </label>
                  <FileUpload
                    onFileSelect={(file) => setUploadForm(prev => ({ ...prev, file }))}
                    accept="image/*"
                    maxSize={5}
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Légende (optionnel)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.caption}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Description de la photo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={uploadForm.isPrimary}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700">
                    Définir comme photo de couverture
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadForm({ file: null, caption: '', isPrimary: false });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadForm.file}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Upload...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
