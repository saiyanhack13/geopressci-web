import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader, Satellite } from 'lucide-react';

// Interface compatible avec l'ancien GoogleMap
interface MapboxMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
  onLocationChange?: (location: { lat: number; lng: number; address?: string }) => void;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    info?: string;
    isValidated?: boolean;
  }>;
  draggableMarker?: boolean;
  className?: string;
}

// Déclaration globale pour Mapbox GL
declare global {
  interface Window {
    mapboxgl: any;
  }
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  center,
  zoom = 15,
  height = '300px',
  onLocationChange,
  markers = [],
  draggableMarker = false,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mainMarkerRef = useRef<any>(null);
  const additionalMarkersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapboxLoaded, setIsMapboxLoaded] = useState(false);

  // Token Mapbox hardcodé pour éviter les problèmes de variables d'environnement
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZG9sa28xMyIsImEiOiJjbWU1eXZhOGoweWJ4MmpzY2Z5cmNxZ2N5In0.ju34YgThquClMpMP-HQwyA';

  // Charger Mapbox GL JS
  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      setError('Token Mapbox manquant. Vérifiez REACT_APP_MAPBOX_ACCESS_TOKEN dans .env');
      setIsLoading(false);
      return;
    }

    if (window.mapboxgl) {
      setIsMapboxLoaded(true);
      return;
    }

    // Charger les styles CSS de Mapbox
    const cssLink = document.createElement('link');
    cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    cssLink.rel = 'stylesheet';
    document.head.appendChild(cssLink);

    // Charger le script Mapbox GL JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      setIsMapboxLoaded(true);
    };
    script.onerror = () => {
      setError('Erreur lors du chargement de Mapbox GL');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Nettoyage
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (cssLink.parentNode) {
        cssLink.parentNode.removeChild(cssLink);
      }
    };
  }, [MAPBOX_ACCESS_TOKEN]);

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!isMapboxLoaded || !mapRef.current || !MAPBOX_ACCESS_TOKEN) return;

    try {
      // Nettoyer le conteneur avant d'initialiser
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }

      // Configurer le token d'accès
      window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      // Valider les coordonnées du centre
      const validCenter = {
        lat: typeof center?.lat === 'number' && !isNaN(center.lat) ? center.lat : 5.3600,
        lng: typeof center?.lng === 'number' && !isNaN(center.lng) ? center.lng : -4.0083
      };

      // Créer la carte Mapbox avec options améliorées
      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [validCenter.lng, validCenter.lat],
        zoom: zoom,
        language: 'fr',
        attributionControl: true,
        interactive: true,
        trackResize: true
      });

      mapInstanceRef.current = map;

      // Attendre que la carte soit chargée
      map.on('load', () => {
        const mapContainer = map.getContainer();
        
        // Nettoyer l'ancien marqueur principal s'il existe
        const existingMainMarker = mapContainer.querySelector('.custom-main-marker');
        if (existingMainMarker) {
          existingMainMarker.remove();
        }
        
        // Créer le marqueur principal (position client) en HTML personnalisé
        const mainCustomMarker = document.createElement('div');
        mainCustomMarker.className = 'custom-main-marker';
        mainCustomMarker.style.cssText = `
          position: absolute;
          width: 32px;
          height: 32px;
          background-color: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          cursor: ${draggableMarker ? 'grab' : 'pointer'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          z-index: 1002;
          pointer-events: auto;
          transform: translate(-50%, -50%);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;
        
        // Ajouter une icône de position au centre
        mainCustomMarker.innerHTML = `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            pointer-events: none;
          "></div>
        `;
        
        // Fonction pour mettre à jour la position du marqueur principal
        const updateMainMarkerPosition = () => {
          const point = map.project([center.lng, center.lat]);
          mainCustomMarker.style.left = point.x + 'px';
          mainCustomMarker.style.top = point.y + 'px';
        };
        
        // Position initiale
        updateMainMarkerPosition();
        
        // Mettre à jour la position lors des mouvements de carte
        map.on('move', updateMainMarkerPosition);
        map.on('zoom', updateMainMarkerPosition);
        
        // Ajouter au conteneur de la carte
        mapContainer.appendChild(mainCustomMarker);
        
        // Gestion du drag si activé
        if (draggableMarker && onLocationChange) {
          let isDragging = false;
          let startX, startY;
          
          mainCustomMarker.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            mainCustomMarker.style.cursor = 'grabbing';
            e.preventDefault();
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convertir les coordonnées pixel en lat/lng
            const lngLat = map.unproject([x, y]);
            
            // Mettre à jour la position du marqueur
            mainCustomMarker.style.left = x + 'px';
            mainCustomMarker.style.top = y + 'px';
          });
          
          document.addEventListener('mouseup', async (e) => {
            if (!isDragging) return;
            isDragging = false;
            mainCustomMarker.style.cursor = 'grab';
            
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convertir les coordonnées pixel en lat/lng
            const lngLat = map.unproject([x, y]);
            const lat = lngLat.lat;
            const lng = lngLat.lng;
            
            try {
              // Géocodage inverse avec Mapbox
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr`
              );
              const data = await response.json();
              
              const address = data.features?.[0]?.place_name || '';
              onLocationChange({ lat, lng, address });
            } catch (error) {
              console.error('Erreur géocodage Mapbox:', error);
              onLocationChange({ lat, lng });
            }
          });
        }
        
        // Effets de survol pour le marqueur principal
        mainCustomMarker.addEventListener('mouseenter', () => {
          mainCustomMarker.style.transform = 'translate(-50%, -50%) scale(1.1)';
          mainCustomMarker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        });
        
        mainCustomMarker.addEventListener('mouseleave', () => {
          mainCustomMarker.style.transform = 'translate(-50%, -50%) scale(1)';
          mainCustomMarker.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        });
        
        // Stocker la référence pour le nettoyage avec fonction de mise à jour de position
        mainMarkerRef.current = { 
          remove: () => mainCustomMarker.remove(),
          updatePosition: (lng: number, lat: number) => {
            const point = map.project([lng, lat]);
            mainCustomMarker.style.left = point.x + 'px';
            mainCustomMarker.style.top = point.y + 'px';
          }
        };

        // Créer des marqueurs HTML personnalisés avec positionnement fixe (sans utiliser Mapbox Marker)
        // Réutiliser la référence mapContainer déjà déclarée
        
        // Nettoyer les anciens marqueurs personnalisés
        const existingCustomMarkers = mapContainer.querySelectorAll('.custom-html-marker');
        existingCustomMarkers.forEach(marker => marker.remove());
        
        // Créer les nouveaux marqueurs HTML personnalisés
        markers.forEach((markerData, index) => {
          const markerColor = markerData.isValidated !== false ? '#10B981' : '#F59E0B';
          
          // Créer l'élément marqueur HTML personnalisé
          const customMarker = document.createElement('div');
          customMarker.className = 'custom-html-marker';
          customMarker.style.cssText = `
            position: absolute;
            width: 24px;
            height: 24px;
            background-color: ${markerColor};
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1000;
            pointer-events: auto;
            transform: translate(-50%, -50%);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          `;
          
          // Fonction pour mettre à jour la position du marqueur
          const updateMarkerPosition = () => {
            const point = map.project([markerData.lng, markerData.lat]);
            customMarker.style.left = point.x + 'px';
            customMarker.style.top = point.y + 'px';
          };
          
          // Position initiale
          updateMarkerPosition();
          
          // Mettre à jour la position lors des mouvements de carte
          map.on('move', updateMarkerPosition);
          map.on('zoom', updateMarkerPosition);
          
          // Ajouter au conteneur de la carte
          mapContainer.appendChild(customMarker);
          
          // Popup personnalisée
          let customPopup = null;
          
          if (markerData.info || markerData.title) {
            // Gestion du clic
            customMarker.addEventListener('click', (e) => {
              e.stopPropagation();
              
              // Fermer les autres popups
              const existingPopups = mapContainer.querySelectorAll('.custom-popup');
              existingPopups.forEach(popup => popup.remove());
              
              if (customPopup && customPopup.parentNode) {
                customPopup.remove();
                customPopup = null;
              } else {
                // Créer une nouvelle popup
                customPopup = document.createElement('div');
                customPopup.className = 'custom-popup';
                customPopup.style.cssText = `
                  position: absolute;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  border: 1px solid #e5e7eb;
                  padding: 12px;
                  max-width: 280px;
                  z-index: 1001;
                  pointer-events: auto;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  transform: translate(-50%, -100%);
                  margin-top: -10px;
                `;
                
                customPopup.innerHTML = `
                  <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">
                    ${markerData.title || `Pressing ${index + 1}`}
                  </div>
                  ${markerData.info ? `<div style="color: #6b7280; font-size: 14px; line-height: 1.4; margin-bottom: 8px;">${markerData.info}</div>` : ''}
                  <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
                    ${markerData.isValidated !== false ? '✅ Position précise' : '⚠️ Position approximative'}
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button 
                      id="route-btn-${index}" 
                      style="
                        flex: 1;
                        background: #3B82F6;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                      "
                      onmouseover="this.style.backgroundColor='#2563EB'"
                      onmouseout="this.style.backgroundColor='#3B82F6'"
                    >
                      🗺️ Itinéraire
                    </button>
                    <button 
                      style="
                        background: #10B981;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                      "
                      onmouseover="this.style.backgroundColor='#059669'"
                      onmouseout="this.style.backgroundColor='#10B981'"
                    >
                      📍 Détails
                    </button>
                  </div>
                  <button style="position: absolute; top: 4px; right: 4px; background: none; border: none; font-size: 16px; cursor: pointer; color: #6b7280;" onclick="this.parentElement.remove();">×</button>
                `;
                
                // Positionner la popup
                const point = map.project([markerData.lng, markerData.lat]);
                customPopup.style.left = point.x + 'px';
                customPopup.style.top = point.y + 'px';
                
                mapContainer.appendChild(customPopup);
                
                // Ajouter l'événement pour le bouton d'itinéraire
                const routeButton = customPopup.querySelector(`#route-btn-${index}`);
                if (routeButton) {
                  routeButton.addEventListener('click', async () => {
                    try {
                      // Afficher un indicateur de chargement
                      routeButton.innerHTML = '⏳ Calcul...';
                      routeButton.style.pointerEvents = 'none';
                      
                      // Supprimer l'ancienne route s'il y en a une
                      if (map.getSource('route')) {
                        map.removeLayer('route');
                        map.removeSource('route');
                      }
                      
                      // Calculer l'itinéraire avec l'API Mapbox Directions
                      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${center.lng},${center.lat};${markerData.lng},${markerData.lat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}&language=fr`;
                      
                      const response = await fetch(directionsUrl);
                      const data = await response.json();
                      
                      if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const routeGeometry = route.geometry;
                        
                        // Ajouter la route à la carte
                        map.addSource('route', {
                          type: 'geojson',
                          data: {
                            type: 'Feature',
                            properties: {},
                            geometry: routeGeometry
                          }
                        });
                        
                        map.addLayer({
                          id: 'route',
                          type: 'line',
                          source: 'route',
                          layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                          },
                          paint: {
                            'line-color': '#3B82F6',
                            'line-width': 4,
                            'line-opacity': 0.8
                          }
                        });
                        
                        // Ajuster la vue pour montrer toute la route
                        const coordinates = routeGeometry.coordinates;
                        const bounds = coordinates.reduce((bounds, coord) => {
                          return bounds.extend(coord);
                        }, new window.mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
                        
                        map.fitBounds(bounds, {
                          padding: 50,
                          duration: 1000
                        });
                        
                        // Mettre à jour le bouton avec les informations de la route
                        const duration = Math.round(route.duration / 60); // en minutes
                        const distance = (route.distance / 1000).toFixed(1); // en km
                        
                        routeButton.innerHTML = `✅ ${distance}km - ${duration}min`;
                        routeButton.style.backgroundColor = '#10B981';
                        
                        // Ajouter un bouton pour effacer la route
                        const clearRouteBtn = document.createElement('button');
                        clearRouteBtn.innerHTML = '❌ Effacer';
                        clearRouteBtn.style.cssText = `
                          background: #EF4444;
                          color: white;
                          border: none;
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 10px;
                          cursor: pointer;
                          margin-left: 4px;
                        `;
                        
                        clearRouteBtn.addEventListener('click', () => {
                          if (map.getSource('route')) {
                            map.removeLayer('route');
                            map.removeSource('route');
                          }
                          routeButton.innerHTML = '🗺️ Itinéraire';
                          routeButton.style.backgroundColor = '#3B82F6';
                          clearRouteBtn.remove();
                        });
                        
                        routeButton.parentNode.appendChild(clearRouteBtn);
                        
                      } else {
                        throw new Error('Aucune route trouvée');
                      }
                      
                    } catch (error) {
                      console.error('Erreur calcul itinéraire:', error);
                      routeButton.innerHTML = '⚠️ Erreur';
                      routeButton.style.backgroundColor = '#EF4444';
                      
                      setTimeout(() => {
                        routeButton.innerHTML = '🗺️ Itinéraire';
                        routeButton.style.backgroundColor = '#3B82F6';
                      }, 2000);
                    } finally {
                      routeButton.style.pointerEvents = 'auto';
                    }
                  });
                }
              }
            });
            
            // Effets de survol stables
            customMarker.addEventListener('mouseenter', () => {
              customMarker.style.transform = 'translate(-50%, -50%) scale(1.1)';
              customMarker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });
            
            customMarker.addEventListener('mouseleave', () => {
              customMarker.style.transform = 'translate(-50%, -50%) scale(1)';
              customMarker.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            });
          }
        });
        
        // Stocker la référence pour le nettoyage
        additionalMarkersRef.current = [];

        setIsLoading(false);
      });

      // Gérer les erreurs de carte
      map.on('error', (e) => {
        console.error('Erreur Mapbox:', e);
        setError('Erreur lors du chargement de la carte Mapbox');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Erreur initialisation Mapbox:', error);
      setError('Erreur lors de l\'initialisation de la carte');
      setIsLoading(false);
    }
  }, [isMapboxLoaded, center, zoom, markers, draggableMarker, onLocationChange, MAPBOX_ACCESS_TOKEN]);

  // Mettre à jour la position du marqueur principal quand le centre change
  useEffect(() => {
    if (mapInstanceRef.current && mainMarkerRef.current) {
      // Utiliser notre fonction updatePosition pour le marqueur HTML personnalisé
      if (mainMarkerRef.current.updatePosition) {
        mainMarkerRef.current.updatePosition(center.lng, center.lat);
      }
      mapInstanceRef.current.setCenter([center.lng, center.lat]);
    }
  }, [center]);

  // Fonction utilitaire pour créer des éléments de marqueur personnalisés
  const createMarkerElement = (color: string, size: string, isMain: boolean) => {
    const el = document.createElement('div');
    el.className = 'mapbox-marker';
    
    // Styles CSS améliorés pour éviter les problèmes de survol
    el.style.cssText = `
      width: ${size};
      height: ${size};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      position: relative;
      z-index: 1;
      pointer-events: auto;
    `;

    // Icône SVG personnalisée avec meilleure stabilité
    el.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
        ${isMain ? '<circle cx="12" cy="9" r="1" fill="' + color + '"/>': ''}
      </svg>
    `;

    // Effet hover amélioré avec debounce pour éviter les scintillements
    let hoverTimeout: NodeJS.Timeout | null = null;
    
    el.addEventListener('mouseenter', () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      el.style.transform = 'scale(1.15)';
      el.style.zIndex = '10';
    });
    
    el.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      }, 100); // Délai pour éviter les scintillements
    });

    return el;
  };

  // Nettoyer les marqueurs lors du démontage
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // Nettoyer les marqueurs HTML personnalisés
        const mapContainer = mapInstanceRef.current.getContainer();
        if (mapContainer) {
          const customMarkers = mapContainer.querySelectorAll('.custom-html-marker');
          customMarkers.forEach(marker => marker.remove());
          const customPopups = mapContainer.querySelectorAll('.custom-popup');
          customPopups.forEach(popup => popup.remove());
        }
        
        mapInstanceRef.current.remove();
      }
      if (mainMarkerRef.current) {
        mainMarkerRef.current.remove();
      }
      if (additionalMarkersRef.current) {
        additionalMarkersRef.current.forEach(marker => {
          if (marker && marker.remove) {
            marker.remove();
          }
        });
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
            <div className="mt-3 text-xs text-red-500">
              💡 Vérifiez que le token Mapbox est configuré dans .env
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Styles CSS simplifiés pour les popups Mapbox */}
      <style>{`
        .mapbox-popup-simple .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .mapbox-popup-simple .mapboxgl-popup-tip {
          border-top-color: #ffffff;
        }
        .mapbox-marker-simple {
          position: relative;
        }
        .mapbox-marker-simple:hover {
          z-index: 10;
        }
      `}</style>
      
      <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center text-gray-500">
              <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="font-medium">Chargement de la carte Mapbox...</p>
              <div className="flex items-center justify-center mt-2 text-xs text-gray-400">
                <Satellite className="w-4 h-4 mr-1" />
                <span>Données cartographiques haute résolution</span>
              </div>
            </div>
          </div>
        )}
      
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: height }}
      />
      
      {draggableMarker && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md text-sm text-gray-600 border">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-blue-500" />
            <span>💡 Déplacez le marqueur pour ajuster votre position</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Powered by Mapbox • Données précises pour l'Afrique
          </div>
        </div>
      )}

      {/* Contrôles de navigation personnalisés */}
      {!isLoading && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 bg-white hover:bg-gray-50 border border-gray-300 rounded shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            title="Zoomer"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 bg-white hover:bg-gray-50 border border-gray-300 rounded shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            title="Dézoomer"
          >
            −
          </button>
        </div>
      )}

      {/* Style personnalisé pour les popups Mapbox */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .mapbox-popup-custom .mapboxgl-popup-content {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .mapbox-popup-custom .mapboxgl-popup-tip {
            border-top-color: #e5e7eb;
          }
          .mapbox-marker {
            transition: transform 0.2s ease;
          }
          .mapbox-marker:hover {
            transform: scale(1.1);
          }
        `
      }} />
    </div>
    </>
  );
};

export default MapboxMap;
