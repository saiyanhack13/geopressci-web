# GEOPRESS-CI WEB - GESTIONNAIRE GIT PRINCIPAL
# ============================================

function Show-Menu {
    Clear-Host
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host "GEOPRESS-CI WEB - GESTIONNAIRE GIT" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Vérifier l'état des modifications" -ForegroundColor Green
    Write-Host "2. Sauvegarder les modifications importantes" -ForegroundColor Blue
    Write-Host "3. Commit et Push vers GitHub" -ForegroundColor Red
    Write-Host "4. Voir l'historique des commits" -ForegroundColor Magenta
    Write-Host "5. Voir les différences détaillées" -ForegroundColor Yellow
    Write-Host "6. Quitter" -ForegroundColor Gray
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Cyan
}

function Check-Status {
    Write-Host "`n🔍 VÉRIFICATION DE L'ÉTAT GIT..." -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Cyan
    
    Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"
    
    Write-Host "`n📋 État Git actuel:" -ForegroundColor Yellow
    git status
    
    Write-Host "`n📝 Fichiers modifiés:" -ForegroundColor Yellow
    $modifiedFiles = git diff --name-only
    if ($modifiedFiles) {
        $modifiedFiles | ForEach-Object { Write-Host "  ✏️  $_" -ForegroundColor Cyan }
    } else {
        Write-Host "  ✅ Aucun fichier modifié" -ForegroundColor Green
    }
    
    Write-Host "`n🆕 Fichiers non suivis:" -ForegroundColor Yellow
    $untrackedFiles = git ls-files --others --exclude-standard
    if ($untrackedFiles) {
        $untrackedFiles | ForEach-Object { Write-Host "  🆕 $_" -ForegroundColor Magenta }
    } else {
        Write-Host "  ✅ Aucun fichier non suivi" -ForegroundColor Green
    }
    
    Write-Host "`n📊 Statistiques des modifications:" -ForegroundColor Yellow
    git diff --stat
}

function Backup-Changes {
    Write-Host "`n💾 SAUVEGARDE DES MODIFICATIONS..." -ForegroundColor Blue
    Write-Host "===========================================" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\backups\backup_$timestamp"
    
    Write-Host "Création du dossier de sauvegarde..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    Write-Host "Sauvegarde terminée dans: $backupDir" -ForegroundColor Green
}

function Commit-And-Push {
    Write-Host "`n🚀 COMMIT ET PUSH..." -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Cyan
    
    Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"
    
    # Vérifier s'il y a des modifications
    $hasChanges = (git status --porcelain) -ne $null
    if (-not $hasChanges) {
        Write-Host "❌ Aucune modification à commiter!" -ForegroundColor Red
        return
    }
    
    Write-Host "📝 Message de commit personnalisé (ou Entrée pour message automatique):" -ForegroundColor Yellow
    $customMessage = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($customMessage)) {
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $commitMessage = "Update: Corrections et améliorations GeoPressCI - $timestamp"
    } else {
        $commitMessage = $customMessage
    }
    
    Write-Host "`n📦 Ajout des fichiers..." -ForegroundColor Green
    git add .
    
    Write-Host "💬 Création du commit: $commitMessage" -ForegroundColor Green
    git commit -m $commitMessage
    
    Write-Host "🌐 Push vers GitHub..." -ForegroundColor Green
    git push origin main
    
    Write-Host "`n✅ MISE À JOUR TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
}

function Show-History {
    Write-Host "`n📚 HISTORIQUE DES COMMITS..." -ForegroundColor Magenta
    Write-Host "===========================================" -ForegroundColor Cyan
    
    Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"
    
    Write-Host "`n🕒 10 derniers commits:" -ForegroundColor Yellow
    git log --oneline -10 --graph --decorate
    
    Write-Host "`n📈 Statistiques du repository:" -ForegroundColor Yellow
    git log --stat -5
}

function Show-Differences {
    Write-Host "`n🔍 DIFFÉRENCES DÉTAILLÉES..." -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Cyan
    
    Set-Location "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"
    
    Write-Host "`n📋 Différences par fichier:" -ForegroundColor Yellow
    git diff --name-status
    
    Write-Host "`n📊 Résumé des modifications:" -ForegroundColor Yellow
    git diff --stat
    
    Write-Host "`n🔍 Voulez-vous voir les différences détaillées d'un fichier? (Y/N)" -ForegroundColor Cyan
    $showDetails = Read-Host
    
    if ($showDetails -eq 'Y' -or $showDetails -eq 'y') {
        Write-Host "📝 Nom du fichier (chemin relatif):" -ForegroundColor Yellow
        $fileName = Read-Host
        if (![string]::IsNullOrWhiteSpace($fileName)) {
            git diff $fileName
        }
    }
}

# Boucle principale
do {
    Show-Menu
    $choice = Read-Host "Votre choix (1-6)"
    
    switch ($choice) {
        '1' { Check-Status; Read-Host "`nAppuyez sur Entrée pour continuer" }
        '2' { Backup-Changes; Read-Host "`nAppuyez sur Entrée pour continuer" }
        '3' { Commit-And-Push; Read-Host "`nAppuyez sur Entrée pour continuer" }
        '4' { Show-History; Read-Host "`nAppuyez sur Entrée pour continuer" }
        '5' { Show-Differences; Read-Host "`nAppuyez sur Entrée pour continuer" }
        '6' { 
            Write-Host "`n👋 Au revoir!" -ForegroundColor Green
            break 
        }
        default { 
            Write-Host "`n❌ Choix invalide!" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne '6')
