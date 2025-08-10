export interface Pressing {
  _id: string;
  name: string;
  address: string;
  rating: number;
  services: string[];
  location: {
    coordinates: [number, number];
    type: 'Point';
  };
  position?: [number, number];
}
