/**
 * Configuration des points de rupture (breakpoints) et des tailles d'écran
 * Basé sur Tailwind CSS par défaut
 */

export const breakpoints = {
  xs: '375px',   // Téléphones très petits
  sm: '640px',   // Téléphones
  md: '768px',   // Tablettes
  lg: '1024px',  // Petits ordinateurs portables
  xl: '1280px',  // Ordinateurs de bureau
  '2xl': '1536px', // Grands écrans
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Media queries pour les points de rupture
 * Utilisation : ${media.sm} { ...styles }
 */
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  // Media queries spécifiques
  hover: '@media (hover: hover)', // Pour les appareils qui supportent le survol
  touch: '@media (hover: none) and (pointer: coarse)', // Pour les appareils tactiles
} as const;

/**
 * Tailles d'éléments UI communes
 */
export const sizes = {
  // Hauteurs de barre de navigation
  navHeight: {
    mobile: '56px',
    desktop: '64px',
  },
  // Hauteur du pied de page
  footerHeight: {
    mobile: '72px',
    desktop: '80px',
  },
  // Espacement standard
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  // Rayons de bordure
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
    '2xl': '1rem',  // 16px
    full: '9999px', // Cercle
  },
  // Ombres
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  // Transitions
  transition: {
    DEFAULT: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color, border-color, color, fill, stroke',
    opacity: 'opacity',
    shadow: 'box-shadow',
    transform: 'transform',
  },
  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

/**
 * Fonction utilitaire pour générer des styles conditionnels en fonction de la taille d'écran
 * @example
 * ${responsive({
 *   fontSize: { base: '1rem', md: '1.25rem', lg: '1.5rem' },
 *   padding: { base: '1rem', lg: '2rem' },
 * })}
 */
export const responsive = (styles: Record<string, Record<string, string>>) => {
  let css = '';
  
  Object.entries(styles).forEach(([property, values]) => {
    // Style de base (mobile first)
    if (values.base) {
      css += `${property}: ${values.base};`;
    }
    
    // Styles conditionnels par breakpoint
    Object.entries(values).forEach(([breakpoint, value]) => {
      if (breakpoint !== 'base' && breakpoint in breakpoints) {
        css += `@media (min-width: ${breakpoints[breakpoint as Breakpoint]}) {`;
        css += `${property}: ${value};`;
        css += '}';
      }
    });
  });
  
  return css;
};

/**
 * Fonction utilitaire pour ajouter des styles de survol, focus, etc. de manière conditionnelle
 */
export const pseudoClasses = {
  hover: '&:hover',
  focus: '&:focus',
  focusWithin: '&:focus-within',
  focusVisible: '&:focus-visible',
  active: '&:active',
  disabled: '&:disabled',
  first: '&:first-child',
  last: '&:last-child',
  odd: '&:nth-child(odd)',
  even: '&:nth-child(even)',
  notFirst: '&:not(:first-child)',
  notLast: '&:not(:last-child)',
  groupHover: '.group:hover &',
} as const;

export default {
  breakpoints,
  media,
  sizes,
  responsive,
  pseudoClasses,
};
