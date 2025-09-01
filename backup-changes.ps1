# GEOPRESS-CI WEB - SCRIPT DE SAUVEGARDE
# ======================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "GEOPRESS-CI WEB - SAUVEGARDE MODIFICATIONS" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan

# Naviguer vers le répertoire du projet
Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

# Créer un dossier de sauvegarde avec timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\backups\backup_$timestamp"

Write-Host "`n1. Création du dossier de sauvegarde..." -ForegroundColor Green
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Fichiers importants à sauvegarder
$importantFiles = @(
    "src\pages\client\SearchPage.tsx",
    "src\components\GoogleMap.tsx",
    "src\components\MapboxMap.tsx",
    "src\components\pressing\AddressLocationManager.tsx",
    "src\components\geolocation\ManualLocationSelector.tsx",
    "src\pages\pressing\LocationPage.tsx",
    "src\components\pressing\PressingCard.tsx",
    "src\components\pressing\PressingList.tsx",
    "src\pages\pressing\PressingPage.tsx",
    "src\components\pressing\PressingDetailPage.tsx"
)

Write-Host "`n2. Sauvegarde des fichiers modifiés..." -ForegroundColor Green
foreach ($file in $importantFiles) {
    if (Test-Path $file) {
        $destPath = Join-Path $backupDir $file
        $destDir = Split-Path $destPath -Parent
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Copy-Item $file $destPath -Force
        Write-Host "  ✅ Sauvegardé: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Fichier non trouvé: $file" -ForegroundColor Yellow
    }
}

# Créer un rapport des modifications
Write-Host "`n3. Génération du rapport..." -ForegroundColor Green
$reportPath = Join-Path $backupDir "RAPPORT_MODIFICATIONS.md"

@"
# RAPPORT DE MODIFICATIONS - GEOPRESS-CI WEB
## Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

### Fichiers modifiés:
$(git diff --name-only | ForEach-Object { "- $_" })

### Fichiers non suivis:
$(git ls-files --others --exclude-standard | ForEach-Object { "- $_" })

### État Git:
```
$(git status)
```

### Derniers commits:
```
$(git log --oneline -5)
```

### Modifications détaillées:
```
$(git diff --stat)
```
"@ | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`n✅ SAUVEGARDE TERMINÉE!" -ForegroundColor Green
Write-Host "Dossier de sauvegarde: $backupDir" -ForegroundColor Cyan

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
