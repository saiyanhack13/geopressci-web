export interface Landmark {
  nom: string;
  position: [number, number];
  description?: string;
  type: 'monument' | 'marché' | 'pharmacie' | 'hotel' | 'place';
}

export const landmarksData: Landmark[] = [
  {
    nom: "La Pyramide",
    position: [5.3235, -4.0243],
    description: "Batiment emblématique du Plateau",
    type: "monument"
  },
  {
    nom: "Hôtel Ivoire",
    position: [5.3591, -3.9834],
    description: "Hôtel historique situé à Cocody",
    type: "hotel"
  },
  {
    nom: "Place de la République",
    position: [5.3235, -4.0243],
    description: "Place centrale d'Abidjan",
    type: "place"
  }
];
