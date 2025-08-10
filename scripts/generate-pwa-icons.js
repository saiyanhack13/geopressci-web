#!/usr/bin/env node

/**
 * Script pour générer les icônes PWA à partir du logo SVG
 * Utilise sharp pour la conversion SVG vers PNG/ICO
 */

const fs = require('fs');
const path = require('path');

// Configuration des tailles d'icônes nécessaires
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 192, name: 'logo192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'logo512.png' }
];

// Icônes spéciales pour les raccourcis
const shortcutIcons = [
  { name: 'icon-order.png', size: 96 },
  { name: 'icon-history.png', size: 96 }
];

const publicDir = path.join(__dirname, '..', 'public');
const logoSvgPath = path.join(publicDir, 'logo.svg');

console.log('🎨 Génération des icônes PWA pour GeoPressCI...');

// Vérifier si Sharp est disponible
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('⚠️  Sharp n\'est pas installé. Installation...');
  console.log('   Exécutez: npm install sharp --save-dev');
  console.log('');
  console.log('📋 En attendant, voici les tailles d\'icônes nécessaires :');
  iconSizes.forEach(icon => {
    console.log(`   - ${icon.name}: ${icon.size}x${icon.size}px`);
  });
  process.exit(1);
}

// Vérifier si le logo SVG existe
if (!fs.existsSync(logoSvgPath)) {
  console.error('❌ Logo SVG non trouvé:', logoSvgPath);
  process.exit(1);
}

async function generateIcon(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Généré: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Erreur pour ${outputPath}:`, error.message);
  }
}

async function generateFavicon() {
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    
    // Générer un PNG 32x32 d'abord
    const tempPngPath = path.join(publicDir, 'temp-favicon.png');
    await sharp(logoSvgPath)
      .resize(32, 32)
      .png()
      .toFile(tempPngPath);
    
    // Convertir en ICO (nécessite un outil externe ou on garde le PNG)
    fs.renameSync(tempPngPath, faviconPath.replace('.ico', '.png'));
    
    console.log('✅ Favicon généré (format PNG)');
  } catch (error) {
    console.error('❌ Erreur favicon:', error.message);
  }
}

async function generateShortcutIcon(name, size, color = '#3B82F6') {
  try {
    // Créer une icône simple avec du texte/forme
    const outputPath = path.join(publicDir, name);
    
    // SVG simple pour les raccourcis
    let svgContent = '';
    
    if (name.includes('order')) {
      svgContent = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" rx="12" fill="${color}"/>
          <path d="M${size/4} ${size/2} L${size*3/4} ${size/2} M${size/2} ${size/4} L${size/2} ${size*3/4}" 
                stroke="white" stroke-width="4" stroke-linecap="round"/>
        </svg>
      `;
    } else if (name.includes('history')) {
      svgContent = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" rx="12" fill="${color}"/>
          <circle cx="${size/2}" cy="${size/2}" r="${size/4}" stroke="white" stroke-width="3" fill="none"/>
          <path d="M${size/2} ${size/3} L${size/2} ${size/2} L${size*2/3} ${size*2/3}" 
                stroke="white" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;
    }
    
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Icône raccourci: ${name}`);
  } catch (error) {
    console.error(`❌ Erreur icône ${name}:`, error.message);
  }
}

async function main() {
  console.log(`📁 Répertoire public: ${publicDir}`);
  console.log(`🎯 Logo source: ${path.basename(logoSvgPath)}`);
  console.log('');
  
  // Générer toutes les icônes principales
  for (const icon of iconSizes) {
    const outputPath = path.join(publicDir, icon.name);
    await generateIcon(logoSvgPath, outputPath, icon.size);
  }
  
  // Générer le favicon
  await generateFavicon();
  
  // Générer les icônes de raccourcis
  for (const shortcut of shortcutIcons) {
    await generateShortcutIcon(shortcut.name, shortcut.size);
  }
  
  console.log('');
  console.log('🎉 Génération des icônes PWA terminée !');
  console.log('');
  console.log('📋 Prochaines étapes :');
  console.log('   1. Vérifiez les icônes dans le dossier public/');
  console.log('   2. Testez l\'installation PWA sur mobile');
  console.log('   3. Validez le manifest avec Lighthouse');
  console.log('');
  console.log('🔗 Ressources utiles :');
  console.log('   - PWA Manifest Validator: https://manifest-validator.appspot.com/');
  console.log('   - Lighthouse PWA Audit: Chrome DevTools > Lighthouse');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateIcon, generateFavicon, generateShortcutIcon };
