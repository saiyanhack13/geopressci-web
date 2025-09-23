/**
 * Utilitaires pour gérer les photos de pressing
 */

// URL de base de l'API (doit correspondre à celle définie dans votre configuration)
const API_BASE_URL = 'https://geopressci-b55css5d.b4a.run//';

/**
 * Construit l'URL complète d'une image à partir de son chemin relatif
 * @param path Chemin relatif de l'image (ex: 'uploads/photos/filename.jpg')
 * @returns URL complète de l'image
 */
const buildImageUrl = (path: string): string => {
  // Si le chemin est déjà une URL complète, on le retourne tel quel
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // Supprime le slash initial s'il existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construit l'URL complète
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Obtient l'URL d'une photo à partir d'un tableau de photos
 * @param photos Tableau de photos (peut être des chaînes ou des objets avec une propriété url)
 * @param index Index de la photo à récupérer
 * @returns L'URL de la photo ou undefined si non trouvée
 */
export const getPhotoUrl = (photos: any[] | undefined, index: number): string | undefined => {
  if (!photos || !Array.isArray(photos) || photos.length <= index) {
    return undefined;
  }
  
  const photo = photos[index];
  let url: string | undefined;
  
  // Si la photo est une chaîne, on la traite comme une URL ou un chemin
  if (typeof photo === 'string') {
    url = photo;
  } 
  // Si c'est un objet avec une propriété url
  else if (photo && typeof photo === 'object' && 'url' in photo) {
    url = photo.url;
  }
  
  // Si on a une URL, on la traite
  if (url) {
    // Si c'est un chemin relatif, on construit l'URL complète
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      return buildImageUrl(url);
    }
    return url;
  }
  
  return undefined;
};

/**
 * Obtient l'URL d'une photo ou un placeholder si non disponible
 * @param photos Tableau de photos
 * @param index Index de la photo
 * @param getPlaceholder Fonction pour obtenir un placeholder
 * @returns L'URL de la photo ou le placeholder
 */
export const getPhotoWithFallback = (
  photos: any[] | undefined, 
  index: number, 
  getPlaceholder: () => string
): string => {
  const photoUrl = getPhotoUrl(photos, index);
  return photoUrl || getPlaceholder();
};
