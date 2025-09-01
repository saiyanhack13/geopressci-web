import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export const geocodingService = {
  /**
   * Convertit une adresse en coordonnées géographiques
   */
  async getGeocode(address: string): Promise<GeoCoordinates | null> {
    try {
      const response = await axios.post(`${API_URL}/geocode`, { address });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du géocodage:', error);
      return null;
    }
  },

  /**
   * Calcule la distance entre deux points en kilomètres
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Convertit les degrés en radians
   */
  toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
};

export default geocodingService;
