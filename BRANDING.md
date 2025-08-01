# GeoPressCI - Branding et Identité Visuelle

## Informations de l'Application

- **Nom complet** : GeoPressCI - Pressing à Domicile
- **Nom court** : GeoPressCI
- **Description** : Service de pressing à domicile en Côte d'Ivoire. Collecte et livraison de vos vêtements directement chez vous.
- **Domaine** : geopressci.netlify.app

## Couleurs de Marque

- **Couleur principale** : `#3B82F6` (Bleu)
- **Couleur secondaire** : `#10B981` (Vert)
- **Couleur d'accent** : `#F59E0B` (Orange)
- **Couleur d'alerte** : `#EF4444` (Rouge)
- **Arrière-plan** : `#FFFFFF` (Blanc)

## Logos et Icônes

### Fichiers Créés
1. **`logo.svg`** - Logo simple 32x32px
2. **`favicon-geopressci.svg`** - Favicon détaillé 64x64px
3. **`logo192-geopressci.svg`** - Logo pour app mobile 192x192px

### Éléments du Logo
- **Machine à laver stylisée** : Représente le service de pressing
- **Lettre "G"** : Initiale de GeoPressCI
- **Pin de localisation** : Représente le service à domicile
- **Bulles** : Effet de nettoyage/lavage

## Métadonnées SEO

### Balises Meta
```html
<title>GeoPressCI - Pressing à Domicile</title>
<meta name="description" content="GeoPressCI - Service de pressing à domicile en Côte d'Ivoire. Collecte et livraison de vos vêtements directement chez vous." />
<meta name="keywords" content="pressing, nettoyage, vêtements, domicile, Côte d'Ivoire, Abidjan, livraison" />
<meta name="author" content="GeoPressCI" />
<meta name="theme-color" content="#3B82F6" />
```

### Manifest Web App
```json
{
  "short_name": "GeoPressCI",
  "name": "GeoPressCI - Pressing à Domicile",
  "description": "Service de pressing à domicile en Côte d'Ivoire",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "categories": ["lifestyle", "utilities"],
  "lang": "fr"
}
```

## Utilisation

### Pour remplacer le favicon par défaut
1. Convertir `favicon-geopressci.svg` en `favicon.ico`
2. Remplacer le fichier `public/favicon.ico` existant

### Pour les icônes d'application mobile
1. Convertir `logo192-geopressci.svg` en PNG 192x192
2. Créer une version 512x512 pour `logo512.png`
3. Remplacer les fichiers existants dans `/public/`

### Outils de Conversion Recommandés
- **SVG vers ICO** : https://convertio.co/svg-ico/
- **SVG vers PNG** : https://svgtopng.com/
- **Optimisation d'images** : https://tinypng.com/

## Cohérence de Marque

### Ton et Style
- **Professionnel** mais **accessible**
- **Moderne** et **efficace**
- **Orienté service client**
- **Géolocalisé** (Côte d'Ivoire)

### Messages Clés
- Service à domicile
- Qualité professionnelle
- Commodité et gain de temps
- Couverture géographique (Abidjan et environs)

## Prochaines Étapes

1. **Créer les fichiers PNG** à partir des SVG
2. **Remplacer les icônes par défaut** de React
3. **Tester l'affichage** sur différents navigateurs
4. **Vérifier l'apparence** sur mobile (PWA)
5. **Optimiser pour le SEO** avec les nouvelles métadonnées
