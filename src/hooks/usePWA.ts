import { useState, useEffect } from 'react';
import type { PWAState } from '../types/pwa';

export const usePWA = (): PWAState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Détecter le mode standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Vérifier si déjà installé
    setIsInstalled(standalone);

    // Gérer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Gérer l'installation réussie
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Envoyer un événement analytics si disponible
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'App Installed'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Pour iOS, considérer comme installable si pas en standalone
    if (iOS && !standalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation acceptée');
        // Envoyer un événement analytics
        if (window.gtag) {
          window.gtag('event', 'pwa_install_accepted', {
            event_category: 'PWA',
            event_label: 'Install Accepted'
          });
        }
      } else {
        console.log('PWA installation refusée');
        // Envoyer un événement analytics
        if (window.gtag) {
          window.gtag('event', 'pwa_install_dismissed', {
            event_category: 'PWA',
            event_label: 'Install Dismissed'
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation PWA:', error);
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const dismissPrompt = (): void => {
    setIsInstallable(false);
    setDeferredPrompt(null);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    deferredPrompt,
    installApp,
    dismissPrompt
  };
};
