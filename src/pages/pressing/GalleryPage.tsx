import React, { useState } from 'react';
import { Image as ImageIcon, Video, ArrowLeft, Upload, Trash2, Plus, Star, Eye } from 'lucide-react';
import { getGalleryPlaceholder, getLogoPlaceholder } from '../../utils/placeholders';
import { 
  useGetPressingPhotosQuery,
  useUploadGalleryPhotoMutation, 
  useUploadProfilePhotoMutation,
  useUploadCoverPhotoMutation,
  useDeletePhotoMutation,
  useSetPrimaryPhotoMutation,
  PressingPhoto,
  PressingPhotos
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
  const { data: pressingPhotos, isLoading, error, refetch: refetchPhotos } = useGetPressingPhotosQuery();
  const [uploadGalleryPhoto] = useUploadGalleryPhotoMutation();
  const [uploadProfilePhoto] = useUploadProfilePhotoMutation();
  const [uploadCoverPhoto] = useUploadCoverPhotoMutation();
  const [deletePhoto] = useDeletePhotoMutation();
  const [setPrimaryPhoto] = useSetPrimaryPhotoMutation();
  
  // Local state
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'gallery' | 'profile' | 'cover'>('gallery');
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    caption: '',
    isPrimary: false
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  // Extract photos from API response
  const galleryPhotos = pressingPhotos?.gallery || [];
  const profilePhoto = pressingPhotos?.profile;
  const coverPhoto = pressingPhotos?.cover;
  const allPhotos = [...galleryPhotos, ...(profilePhoto ? [profilePhoto] : []), ...(coverPhoto ? [coverPhoto] : [])];
  
  // Combine with static media for display
  const photos = allPhotos.length > 0 ? allPhotos : [];
  
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

  // Handle photo upload with Cloudinary
  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', uploadForm.file);
      if (uploadForm.caption) {
        formData.append('caption', uploadForm.caption);
      }
      
      let uploadMutation;
      let successMessage = '';
      
      switch (uploadType) {
        case 'profile':
          uploadMutation = uploadProfilePhoto({ formData });
          successMessage = 'Photo de profil mise à jour avec succès!';
          break;
        case 'cover':
          uploadMutation = uploadCoverPhoto({ formData });
          successMessage = 'Photo de couverture mise à jour avec succès!';
          break;
        case 'gallery':
        default:
          uploadMutation = uploadGalleryPhoto({ formData });
          successMessage = 'Photo ajoutée à la galerie avec succès!';
          break;
      }
      
      const result = await uploadMutation.unwrap();
      
      // Si c'est marqué comme primaire, définir comme photo principale
      if (uploadForm.isPrimary && result._id) {
        await setPrimaryPhoto(result._id).unwrap();
      }
      
      toast.success(successMessage);
      setShowUploadModal(false);
      setUploadForm({ file: null, caption: '', isPrimary: false });
      setUploadType('gallery');
      refetchPhotos();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await setPrimaryPhoto(photoId).unwrap();
      toast.success('Photo définie comme photo principale');
      refetchPhotos();
    } catch (error: any) {
      console.error('Erreur set primary:', error);
      toast.error(error?.data?.message || 'Erreur lors de la définition de la photo principale');
    }
  };

  const handleDelete = async (id: string) => {
    const photo = allPhotos.find(p => p._id === id);
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
      await setPrimaryPhoto(id).unwrap();
      toast.success('Photo définie comme couverture');
      refetchPhotos();
    } catch (error: any) {
      console.error('Erreur set cover:', error);
      toast.error(error?.data?.message || 'Erreur lors de la définition de la couverture');
    }
  };

  const openUploadModal = (type: 'gallery' | 'profile' | 'cover' = 'gallery') => {
    setUploadType(type);
    setShowUploadModal(true);
  };

  const categories = {
    storefront: 'Devanture & Intérieur',
    equipment: 'Équipements',
    results: 'Résultats',
    team: 'Équipe'
  };

  return (
    <div className="min-h-screen bg-gray-50">

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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openUploadModal('gallery')}
                className="flex items-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base touch-target">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Galerie</span>
                <span className="sm:hidden">📸</span>
              </button>
              <button 
                onClick={() => openUploadModal('profile')}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm touch-target">
                <span>👤</span>
                <span className="hidden sm:inline">Profil</span>
              </button>
              <button 
                onClick={() => openUploadModal('cover')}
                className="flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm touch-target">
                <span>🖼️</span>
                <span className="hidden sm:inline">Couverture</span>
              </button>
            </div>
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
            {/* Photos spéciales (Profil et Couverture) */}
            {(profilePhoto || coverPhoto) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos principales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Photo de profil */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-700">👤 Photo de profil</h3>
                      <button
                        onClick={() => openUploadModal('profile')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {profilePhoto ? 'Changer' : 'Ajouter'}
                      </button>
                    </div>
                    {profilePhoto ? (
                      <div className="relative group">
                        <img
                          src={profilePhoto.optimizedUrl || profilePhoto.url}
                          alt="Photo de profil"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(profilePhoto._id)}
                            className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Aucune photo de profil</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo de couverture */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-700">🖼️ Photo de couverture</h3>
                      <button
                        onClick={() => openUploadModal('cover')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {coverPhoto ? 'Changer' : 'Ajouter'}
                      </button>
                    </div>
                    {coverPhoto ? (
                      <div className="relative group">
                        <img
                          src={coverPhoto.optimizedUrl || coverPhoto.url}
                          alt="Photo de couverture"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(coverPhoto._id)}
                            className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Aucune photo de couverture</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  {galleryPhotos.length} photo{galleryPhotos.length > 1 ? 's' : ''} dans la galerie
                </div>
              </div>
            </div>

            {/* Galerie Photos - Cloudinary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">📸 Galerie</h2>
                <button
                  onClick={() => openUploadModal('gallery')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une photo
                </button>
              </div>
              
              {galleryPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune photo dans la galerie</h3>
                  <p className="text-gray-600 mb-6">Ajoutez des photos pour présenter votre pressing</p>
                  <button
                    onClick={() => openUploadModal('gallery')}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    Ajouter la première photo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {galleryPhotos.map(photo => (
                    <div key={photo._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
                      <div className="relative h-32 sm:h-48">
                        <img 
                          src={photo.thumbnailUrl || photo.optimizedUrl || photo.url} 
                          alt={photo.caption || 'Photo galerie'} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex flex-col gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(photo._id)}
                            disabled={uploading}
                            className="bg-white/90 p-1.5 sm:p-2 rounded-full text-red-500 hover:bg-white disabled:opacity-50 touch-target"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          {!photo.isPrimary && (
                            <button 
                              onClick={() => handleSetPrimary(photo._id)}
                              disabled={uploading}
                              className="bg-white/90 p-1.5 sm:p-2 rounded-full text-yellow-500 hover:bg-white disabled:opacity-50 touch-target"
                              aria-label="Définir comme principale"
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                        {photo.isPrimary && (
                          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Principale
                          </span>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {photo.caption || 'Photo sans titre'}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                          <span className="truncate">
                            {new Date(photo.uploadedAt).toLocaleDateString('fr-FR')}
                          </span>
                          {photo.publicId && (
                            <span className="text-green-600 text-xs">☁️ Cloudinary</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
              <h3 className="text-lg font-semibold mb-4">
                {uploadType === 'profile' && 'Changer la photo de profil'}
                {uploadType === 'cover' && 'Changer la photo de couverture'}
                {uploadType === 'gallery' && 'Ajouter à la galerie'}
              </h3>
              
              <div className="space-y-4">
                {/* Type de photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de photo
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadType('gallery')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        uploadType === 'gallery'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      📸 Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType('profile')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        uploadType === 'profile'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      👤 Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType('cover')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        uploadType === 'cover'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🖼️ Couverture
                    </button>
                  </div>
                </div>

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
                
                {uploadType === 'gallery' && (
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
                )}
                
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
