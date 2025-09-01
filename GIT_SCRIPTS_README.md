# 🚀 Scripts de Gestion Git - GeoPressCI Web

## 📋 Description

Ce dossier contient plusieurs scripts pour faciliter la gestion des modifications Git du projet GeoPressCI Web.

## 📁 Scripts Disponibles

### 1. 🎯 `git-manager.ps1` (RECOMMANDÉ)
**Script principal avec menu interactif**

**Utilisation :**
```powershell
.\git-manager.ps1
```

**Fonctionnalités :**
- ✅ Vérification de l'état des modifications
- 💾 Sauvegarde automatique des fichiers importants
- 🚀 Commit et push vers GitHub avec message personnalisé
- 📚 Historique des commits avec graphiques
- 🔍 Différences détaillées par fichier
- 🎨 Interface colorée et intuitive

### 2. 📊 `check-changes.bat`
**Vérification rapide de l'état Git**

**Utilisation :**
```cmd
check-changes.bat
```

**Fonctionnalités :**
- État Git actuel
- Fichiers modifiés
- Derniers commits
- Configuration remote

### 3. ⚡ `update-git.bat`
**Mise à jour rapide (automatique)**

**Utilisation :**
```cmd
update-git.bat
```

**Fonctionnalités :**
- Ajout automatique de tous les fichiers
- Commit avec timestamp automatique
- Push vers origin main

### 4. 🎨 `update-git.ps1`
**Version PowerShell avec confirmation**

**Utilisation :**
```powershell
.\update-git.ps1
```

**Fonctionnalités :**
- Affichage des modifications
- Demande de confirmation
- Interface colorée
- Gestion d'erreurs

### 5. 💾 `backup-changes.ps1`
**Sauvegarde des modifications importantes**

**Utilisation :**
```powershell
.\backup-changes.ps1
```

**Fonctionnalités :**
- Sauvegarde des fichiers critiques
- Génération de rapport détaillé
- Horodatage automatique
- Structure organisée

## 🎯 Utilisation Recommandée

### Pour les utilisateurs débutants :
```cmd
# Utiliser le script batch simple
check-changes.bat
update-git.bat
```

### Pour les utilisateurs avancés :
```powershell
# Utiliser le gestionnaire principal
.\git-manager.ps1
```

## 📂 Fichiers Surveillés

Les scripts surveillent automatiquement ces fichiers importants :
- `src\pages\client\SearchPage.tsx`
- `src\components\GoogleMap.tsx`
- `src\components\MapboxMap.tsx`
- `src\components\pressing\AddressLocationManager.tsx`
- `src\components\geolocation\ManualLocationSelector.tsx`
- `src\pages\pressing\LocationPage.tsx`
- `src\components\pressing\PressingCard.tsx`
- `src\components\pressing\PressingList.tsx`
- `src\pages\pressing\PressingPage.tsx`
- `src\components\pressing\PressingDetailPage.tsx`

## 🔧 Configuration

### Prérequis :
- Git installé et configuré
- PowerShell (pour les scripts .ps1)
- Accès au repository GitHub : `https://github.com/saiyanhack13/geopressci-web.git`

### Configuration Git :
```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

## 🚨 Sécurité

### Avant d'utiliser les scripts :
1. ✅ Vérifiez toujours l'état avec `check-changes.bat`
2. 💾 Faites une sauvegarde avec `backup-changes.ps1`
3. 🔍 Examinez les modifications avant le commit
4. 📝 Utilisez des messages de commit descriptifs

### Messages de commit recommandés :
- `feat: Nouvelle fonctionnalité de géolocalisation`
- `fix: Correction bug affichage carte`
- `update: Amélioration interface utilisateur`
- `refactor: Restructuration composants pressing`

## 🆘 Dépannage

### Erreur "Execution Policy" :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreur d'authentification Git :
```bash
git config --global credential.helper manager-core
```

### Conflit de merge :
```bash
git status
git add .
git commit -m "Résolution conflit"
```

## 📞 Support

En cas de problème :
1. Vérifiez la configuration Git
2. Consultez les logs d'erreur
3. Utilisez `git status` pour diagnostiquer
4. Contactez l'équipe de développement

---

## 🎉 Utilisation Rapide

**Pour une mise à jour complète en 3 étapes :**

1. **Vérification :**
   ```cmd
   check-changes.bat
   ```

2. **Sauvegarde :**
   ```powershell
   .\backup-changes.ps1
   ```

3. **Mise à jour :**
   ```powershell
   .\git-manager.ps1
   ```

**Ou en une seule commande :**
```cmd
update-git.bat
```

---

*Dernière mise à jour : 01/09/2025*
