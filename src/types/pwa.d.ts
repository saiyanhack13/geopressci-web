// Types pour les fonctionnalités PWA

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        [key: string]: any;
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }

  interface Navigator {
    standalone?: boolean;
  }

  interface ServiceWorkerRegistration {
    showNotification(title: string, options?: ExtendedNotificationOptions): Promise<void>;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface ExtendedNotificationOptions extends NotificationOptions {
    vibrate?: number[];
    badge?: string;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

// Types pour les hooks PWA
export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  installApp: () => Promise<void>;
  dismissPrompt: () => void;
}

// Types pour les composants PWA
export interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export interface PWAInstallPromptProps {
  delay?: number;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  autoShow?: boolean;
}

// Types pour le service worker
export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

// Types pour les notifications
export interface PWANotificationOptions extends ExtendedNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
}

export {};
