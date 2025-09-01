# GEOPRESS-CI WEB - MISE A JOUR GIT SIMPLE
# ========================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "GEOPRESS-CI WEB - MISE A JOUR GIT" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan

# Naviguer vers le repertoire du projet
Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

Write-Host "`n1. Verification de l'etat Git..." -ForegroundColor Green
git status

Write-Host "`n2. Fichiers modifies:" -ForegroundColor Green
$modifiedFiles = git diff --name-only
if ($modifiedFiles) {
    $modifiedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    
    Write-Host "`n3. Voulez-vous continuer avec le commit et push? (Y/N)" -ForegroundColor Cyan
    $confirmation = Read-Host
    
    if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
        Write-Host "`n4. Ajout de tous les fichiers..." -ForegroundColor Green
        git add .
        
        Write-Host "`n5. Creation du commit..." -ForegroundColor Green
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $commitMessage = "Update: Corrections et ameliorations GeoPressCI - $timestamp"
        git commit -m $commitMessage
        
        Write-Host "`n6. Push vers GitHub..." -ForegroundColor Green
        git push origin main
        
        Write-Host "`nMISE A JOUR TERMINEE AVEC SUCCES!" -ForegroundColor Green
    } else {
        Write-Host "`nOPERATION ANNULEE" -ForegroundColor Red
    }
} else {
    Write-Host "  Aucun fichier modifie" -ForegroundColor Gray
    Write-Host "`nAucune mise a jour necessaire." -ForegroundColor Green
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
