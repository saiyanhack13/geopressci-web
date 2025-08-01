/**
 * Utilitaires pour les placeholders
 */

// Fonction pour générer un SVG en base64
const createSvgPlaceholder = (width: number, height: number, text: string, bgColor: string, textColor: string): string => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#${textColor}" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

export const getLogoPlaceholder = (size: number = 150): string => {
  return createSvgPlaceholder(size, size, 'Logo', '3B82F6', 'FFFFFF');
};

export const getCoverPlaceholder = (width: number = 1200, height: number = 400): string => {
  return createSvgPlaceholder(width, height, 'Photo de couverture', 'E5E7EB', '6B7280');
};

export const getServicePlaceholder = (width: number = 300, height: number = 200): string => {
  return createSvgPlaceholder(width, height, 'Service', 'E5E7EB', '6B7280');
};

export const getGalleryPlaceholder = (width: number = 800, height: number = 600): string => {
  return createSvgPlaceholder(width, height, 'Galerie', 'E5E7EB', '6B7280');
};
