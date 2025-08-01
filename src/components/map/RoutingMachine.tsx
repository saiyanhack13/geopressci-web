// @ts-nocheck
import React, { useEffect, useRef, useCallback } from 'react';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { useMap } from 'react-leaflet';

// Extension des types de leaflet-routing-machine
declare module 'leaflet-routing-machine' {
  interface RoutingControlOptions {
    createMarker?: (i: number, waypoint: any, n: number) => LeafletMarker | null;
  }
}

interface RoutingMachineProps {
  start: LatLngTuple | null;
  end: LatLngTuple | null;
  onRoutingControlCreated?: (control: any) => void;
}

const RoutingMachine: React.FC<RoutingMachineProps> = ({ start, end, onRoutingControlCreated }) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const routeCacheRef = useRef<Map<string, any>>(new Map());
  const isMountedRef = useRef(true);
  
  // Référence pour stocker la fonction console.warn d'origine avec un type plus précis
  type ConsoleWarnType = (message?: any, ...optionalParams: any[]) => void;
  const originalConsoleWarnRef = useRef<ConsoleWarnType | null>(null);

  // Fonction pour masquer temporairement l'avertissement OSRM
  const suppressOSRMWarning = useCallback(() => {
    if (typeof window === 'undefined' || !window.console) return;
    
    if (!originalConsoleWarnRef.current) {
      // Sauvegarder la fonction d'origine
      const originalWarn = window.console.warn.bind(window.console);
      originalConsoleWarnRef.current = originalWarn;
      
      // Fonction de remplacement avec typage correct
      const wrappedWarn: ConsoleWarnType = (message?: any, ...optionalParams: any[]) => {
        try {
          const messageStr = message?.toString() || '';
          if (messageStr.includes('OSRM') || 
              messageStr.includes('demo server') || 
              messageStr.includes('NOT SUITABLE FOR PRODUCTION')) {
            return; // Ignorer les avertissements OSRM
          }
          // Appeler la fonction d'origine avec les paramètres
          originalWarn(message, ...optionalParams);
        } catch (e) {
          // En cas d'erreur, restaurer la fonction d'origine
          window.console.warn = originalWarn;
          throw e;
        }
      };
      
      // Remplacer console.warn
      window.console.warn = wrappedWarn;
    }
  }, []);

  // Fonction pour restaurer console.warn
  const restoreConsoleWarn = useCallback(() => {
    if (typeof window === 'undefined' || !window.console) return;
    
    if (originalConsoleWarnRef.current) {
      // Restaurer la fonction d'origine
      window.console.warn = originalConsoleWarnRef.current;
      originalConsoleWarnRef.current = null;
    }
  }, []);

  // Fonction de nettoyage
  const cleanup = useCallback(() => {
    if (routingControlRef.current && map) {
      try {
        // Supprimer les event listeners
        routingControlRef.current.off('routesfound');
        routingControlRef.current.off('routingerror');
        routingControlRef.current.off('error');
        
        // Supprimer le contrôle de la carte
        map.removeControl(routingControlRef.current);
      } catch (error) {
        console.warn('Erreur lors du nettoyage du contrôle de routage:', error);
      }
      routingControlRef.current = null;
    }
  }, [map]);

  // Fonction pour créer une clé de cache unique
  const createCacheKey = useCallback((start: LatLngTuple, end: LatLngTuple): string => {
    return `${start[0].toFixed(6)},${start[1].toFixed(6)}-${end[0].toFixed(6)},${end[1].toFixed(6)}`;
  }, []);

  // Fonction pour créer le routage avec debounce
  const createRouting = useCallback((startCoords: LatLngTuple, endCoords: LatLngTuple) => {
    if (!map || !isMountedRef.current) return;

    // Vérifier le cache
    const cacheKey = createCacheKey(startCoords, endCoords);
    if (routeCacheRef.current.has(cacheKey)) {
      return; // Route déjà créée, éviter la recréation
    }

    // Nettoyer le contrôle existant
    cleanup();

    // Masquer l'avertissement OSRM
    suppressOSRMWarning();

    try {
      // Valider les coordonnées
      if (!Array.isArray(startCoords) || !Array.isArray(endCoords) ||
          startCoords.length !== 2 || endCoords.length !== 2 ||
          isNaN(startCoords[0]) || isNaN(startCoords[1]) ||
          isNaN(endCoords[0]) || isNaN(endCoords[1])) {
        console.warn('Coordonnées invalides pour le routage');
        return;
      }

      // Créer le contrôle de routage
      const routingControl = (window as any).L.Routing.control({
        waypoints: [
          latLng(startCoords[0], startCoords[1]),
          latLng(endCoords[0], endCoords[1])
        ],
        router: (window as any).L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving'
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        lineOptions: {
          styles: [{
            color: '#6d28d9',
            weight: 4,
            opacity: 0.8,
            className: 'leaflet-routing-line'
          }],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        }
      });

      routingControlRef.current = routingControl;

      // Gestion de l'événement routesfound
      routingControl.on('routesfound', (e: any) => {
        if (!isMountedRef.current) return;
        
        try {
          // Masquer les éléments indésirables avec un délai
          setTimeout(() => {
            if (!isMountedRef.current) return;
            
            // Masquer les marqueurs de routage
            const markers = document.querySelectorAll('.leaflet-routing-container .leaflet-marker-icon');
            markers.forEach((marker: Element) => {
              (marker as HTMLElement).style.display = 'none';
            });
            
            // Masquer le panneau d'instructions
            const container = document.querySelector('.leaflet-routing-container');
            if (container) {
              (container as HTMLElement).style.display = 'none';
            }
          }, 100);
          
          // Ajouter à la cache
          routeCacheRef.current.set(cacheKey, true);
          
        } catch (error) {
          console.warn('Erreur lors du traitement de la route:', error);
        }
      });

      // Gestion des erreurs
      routingControl.on('routingerror', (error: any) => {
        console.warn('Erreur de routage:', error);
      });

      routingControl.on('error', (error: any) => {
        console.warn('Erreur générale de routage:', error);
      });

      // Ajouter à la carte
      routingControl.addTo(map);

      // Notifier le parent si nécessaire
      if (onRoutingControlCreated) {
        onRoutingControlCreated(routingControl);
      }

    } catch (error) {
      console.error('Erreur lors de la création du routage:', error);
    } finally {
      // Ne pas restaurer immédiatement pour éviter les boucles d'avertissement
      // La restauration se fera au démontage du composant
    }
  }, [map, cleanup, suppressOSRMWarning, restoreConsoleWarn, createCacheKey, onRoutingControlCreated]);

  // Effect principal avec debounce
  useEffect(() => {
    // Nettoyer le timeout précédent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Si pas de coordonnées, nettoyer
    if (!start || !end) {
      cleanup();
      return;
    }

    // Debounce de 300ms pour éviter les re-renders fréquents
    debounceTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        createRouting(start, end);
      }
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [start, end, createRouting, cleanup]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Nettoyer le timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Nettoyer le contrôle de routage
      cleanup();
      
      // Restaurer console.warn
      restoreConsoleWarn();
      
      // Vider le cache
      routeCacheRef.current.clear();
    };
  }, [cleanup, restoreConsoleWarn]);

  return null;
};

export default RoutingMachine;
