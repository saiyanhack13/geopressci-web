import React from 'react';
import { Download, Smartphone, Plus, Share } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import type { PWAInstallButtonProps } from '../../types/pwa';

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  showText = true
}) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();

  // Ne pas afficher si déjà installé ou non installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = () => {
    if (isIOS) {
      // Pour iOS, afficher les instructions
      alert(
        'Pour installer GeoPressCI sur votre iPhone/iPad :\n\n' +
        '1. Appuyez sur le bouton "Partager" (carré avec flèche vers le haut)\n' +
        '2. Faites défiler et appuyez sur "Sur l\'écran d\'accueil"\n' +
        '3. Appuyez sur "Ajouter" pour confirmer'
      );
    } else {
      installApp();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isIOS ? (
        <Share className={iconSize[size]} />
      ) : (
        <Download className={iconSize[size]} />
      )}
      
      {showText && (
        <span className="ml-2">
          {isIOS ? 'Installer l\'app' : 'Installer'}
        </span>
      )}
    </button>
  );
};

export default PWAInstallButton;
