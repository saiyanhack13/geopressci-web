/**
 * Utilitaires pour la gestion des dates sans problèmes de timezone
 */

/**
 * Convertit une date en format ISO sans décalage de timezone
 * Préserve la date locale exacte
 */
export const toLocalISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
};

/**
 * Convertit une date en format de date locale (YYYY-MM-DD)
 * Sans décalage de timezone
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Crée une date à partir d'une date locale et d'une heure
 * Sans problème de timezone
 */
export const createLocalDateTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
  return localDate;
};

/**
 * Formate une date pour l'affichage en français
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formate une heure pour l'affichage
 */
export const formatTimeForDisplay = (time: string): string => {
  return time;
};

/**
 * Combine date et heure pour l'affichage
 */
export const formatDateTimeForDisplay = (date: Date, time: string): string => {
  const dateStr = formatDateForDisplay(date);
  const timeStr = formatTimeForDisplay(time);
  return `${dateStr} à ${timeStr}`;
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

/**
 * Vérifie si une date est demain
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear();
};

/**
 * Obtient le nom du jour en français
 */
export const getDayName = (date: Date): string => {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[date.getDay()];
};

/**
 * Obtient le nom du mois en français
 */
export const getMonthName = (date: Date): string => {
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return months[date.getMonth()];
};

/**
 * Formate une date de manière relative (aujourd'hui, demain, etc.)
 */
export const formatRelativeDate = (date: Date): string => {
  if (isToday(date)) {
    return "Aujourd'hui";
  } else if (isTomorrow(date)) {
    return "Demain";
  } else {
    return formatDateForDisplay(date);
  }
};
