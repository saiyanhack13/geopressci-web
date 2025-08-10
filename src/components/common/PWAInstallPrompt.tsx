import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Plus } from 'lucide-react';
import type { PWAInstallPromptProps } from '../../types/pwa';

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  delay = 3000,
  showOnMobile = true,
  showOnDesktop = true,
  autoShow = true
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si c'est iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Vérifier si l'app est déjà en mode standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Vérifier si l'utilisateur a déjà refusé l'installation
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    setHasBeenDismissed(dismissed === 'true');

    // Écouter l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Afficher le prompt après un délai
      if (autoShow) {
        setTimeout(() => {
          if (!hasBeenDismissed && !isStandalone) {
            setShowInstallPrompt(true);
          }
        }, delay);
      }
    };

    // Écouter l'événement d'installation réussie
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA installée avec succès');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Pour iOS, afficher le prompt manuellement
    if (iOS && !standalone && !hasBeenDismissed && showOnMobile && autoShow) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, delay + 2000); // Délai supplémentaire pour iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [hasBeenDismissed, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome installation
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Utilisateur a accepté l\'installation');
      } else {
        console.log('Utilisateur a refusé l\'installation');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    setHasBeenDismissed(true);
  };

  // Ne pas afficher si déjà en mode standalone ou déjà refusé
  if (isStandalone || hasBeenDismissed || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg z-50 animate-slide-up">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              Installer GeoPressCI
            </h3>
            <p className="text-xs text-blue-100">
              {isIOS 
                ? "Appuyez sur 'Partager' puis 'Sur l'écran d'accueil'"
                : "Ajoutez l'app à votre écran d'accueil"
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Installer</span>
            </button>
          )}
          
          {isIOS && (
            <div className="flex items-center space-x-1 text-xs">
              <div className="bg-white bg-opacity-20 p-1 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M15 10a.75.75 0 01-.75.75H7.612l2.158 2.158a.75.75 0 11-1.06 1.06l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5a.75.75 0 111.06 1.06L7.612 9.25h6.638A.75.75 0 0115 10z" clipRule="evenodd" />
                </svg>
              </div>
              <Plus className="w-4 h-4" />
            </div>
          )}
          
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
