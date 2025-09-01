# 🚀 Guide Rapide - Mise à Jour Git GeoPressCI

## ⚡ Scripts Disponibles (par ordre de simplicité)

### 1. 📊 **Vérification Rapide** (RECOMMANDÉ EN PREMIER)
```cmd
git-status-check.bat
```
**Fonction :** Vérifier l'état actuel sans rien modifier

### 2. 🚀 **Mise à Jour Rapide** (LE PLUS SIMPLE)
```cmd
quick-git-update.bat
```
**Fonction :** Commit et push avec confirmation

### 3. 🎨 **Mise à Jour PowerShell** (PLUS D'OPTIONS)
```powershell
.\simple-git-update.ps1
```
**Fonction :** Version PowerShell avec interface colorée

## 📋 Procédure Recommandée

### Étape 1 : Vérification
```cmd
git-status-check.bat
```
- Vérifiez quels fichiers ont été modifiés
- Confirmez que vous êtes sur la bonne branche
- Vérifiez la connexion au repository

### Étape 2 : Mise à Jour
```cmd
quick-git-update.bat
```
- Le script vous montrera les fichiers modifiés
- Tapez `Y` pour confirmer
- Le commit et push se feront automatiquement

## 🎯 Utilisation Immédiate

**Pour une mise à jour complète en 2 commandes :**

1. **Vérification :**
   ```cmd
   git-status-check.bat
   ```

2. **Mise à jour :**
   ```cmd
   quick-git-update.bat
   ```

## 📁 Fichiers Qui Seront Mis à Jour

Les scripts détecteront automatiquement tous les fichiers modifiés, notamment :
- ✅ `src/pages/client/SearchPage.tsx`
- ✅ `src/components/GoogleMap.tsx`
- ✅ `src/components/MapboxMap.tsx`
- ✅ `src/components/pressing/AddressLocationManager.tsx`
- ✅ `src/components/geolocation/ManualLocationSelector.tsx`
- ✅ `src/pages/pressing/LocationPage.tsx`
- ✅ Et tous les autres fichiers modifiés

## 🔧 En Cas de Problème

### Si PowerShell ne fonctionne pas :
```cmd
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Si Git demande une authentification :
- Utilisez vos identifiants GitHub
- Ou configurez un token d'accès personnel

### Si vous avez des conflits :
```cmd
git status
git add .
git commit -m "Resolution conflits"
git push origin main
```

## 🎉 Message de Commit Automatique

Format : `Update: Corrections et ameliorations GeoPressCI - 2025-09-01_11-06-23`

---

## ⚡ UTILISATION IMMÉDIATE

**Ouvrez un terminal dans le dossier du projet et exécutez :**

```cmd
quick-git-update.bat
```

**C'est tout ! Le script fera le reste.**

---

*Dernière mise à jour : 01/09/2025 11:06*
