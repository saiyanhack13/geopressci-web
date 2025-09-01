# GEOPRESS-CI WEB - SCRIPT DE MISE A JOUR GIT
# =============================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "GEOPRESS-CI WEB - MISE A JOUR GIT" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan

# Naviguer vers le répertoire du projet
Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

Write-Host "`n1. Vérification de l'état Git..." -ForegroundColor Green
git status

Write-Host "`n2. Fichiers modifiés:" -ForegroundColor Green
$modifiedFiles = git diff --name-only
if ($modifiedFiles) {
    $modifiedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
} else {
    Write-Host "  Aucun fichier modifié" -ForegroundColor Gray
}

Write-Host "`n3. Fichiers non suivis:" -ForegroundColor Green
$untrackedFiles = git ls-files --others --exclude-standard
if ($untrackedFiles) {
    $untrackedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Magenta }
} else {
    Write-Host "  Aucun fichier non suivi" -ForegroundColor Gray
}

# Demander confirmation
Write-Host "`n4. Voulez-vous continuer avec le commit et push? (Y/N)" -ForegroundColor Cyan
$confirmation = Read-Host

if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
    Write-Host "`n5. Ajout de tous les fichiers..." -ForegroundColor Green
    git add .
    
    Write-Host "`n6. Création du commit..." -ForegroundColor Green
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $commitMessage = "Update: Corrections et améliorations GeoPressCI - $timestamp"
    git commit -m $commitMessage
    
    Write-Host "`n7. Push vers origin..." -ForegroundColor Green
    git push origin main
    
    Write-Host "`n✅ MISE À JOUR TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
} else {
    Write-Host "`n❌ OPÉRATION ANNULÉE" -ForegroundColor Red
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
