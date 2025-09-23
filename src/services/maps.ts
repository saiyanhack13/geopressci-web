import axios from 'axios';

// L'API est maintenant appelée via le backend pour éviter les problèmes CORS

export interface Route {
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  polyline?: string;
  points: Array<{
    lat: number;
    lng: number;
  }>;
  steps?: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
    html_instructions: string;
    travel_mode: string;
  }>;
  start_address?: string;
  end_address?: string;
}

export const getRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<Route | null> => {
  try {
    console.log('Fetching route from:', origin, 'to:', destination, 'mode:', mode);
    
    const response = await axios.get(
      `https://geopressci-b55css5d.b4a.run/api/v1/maps/directions`,
      {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode
        },
        timeout: 10000 // 10 secondes de timeout
      }
    );

    console.log('Route API response:', response.data);

    if (!response.data.success) {
      console.error('Error in route response:', response.data.message);
      return null;
    }

    const routeData = response.data.data;
    
    if (!routeData) {
      console.error('No route data in response');
      return null;
    }

    // Transformer les données de l'API en format attendu par le composant
    const route: Route = {
      distance: routeData.distance,
      duration: routeData.duration,
      points: routeData.points || [],
      polyline: routeData.polyline,
      start_address: routeData.start_address,
      end_address: routeData.end_address
    };

    console.log('Processed route:', route);
    return route;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code;
    const errorResponse = (error as any)?.response?.data;
    const errorConfig = (error as any)?.config;
    
    console.error('Error getting route:', {
      message: errorMessage,
      code: errorCode,
      response: errorResponse,
      config: errorConfig ? {
        url: errorConfig.url,
        params: errorConfig.params,
        method: errorConfig.method
      } : undefined
    });
    
    return null;
  }
};

export const decodePolyline = (encoded: string) => {
  const points: [number, number][] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat * 1e-5, lng * 1e-5]);
  }

  return points;
};
