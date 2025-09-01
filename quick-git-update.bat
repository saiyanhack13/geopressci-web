@echo off
echo ===========================================
echo GEOPRESS-CI WEB - MISE A JOUR GIT RAPIDE
echo ===========================================

cd /d "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

echo.
echo 1. Verification de l'etat Git...
echo -----------------------------------
git status

echo.
echo 2. Fichiers modifies:
echo --------------------
git diff --name-only

echo.
echo 3. Fichiers non suivis:
echo ----------------------
git ls-files --others --exclude-standard

echo.
set /p confirm="Voulez-vous continuer avec le commit et push? (Y/N): "

if /i "%confirm%"=="Y" (
    echo.
    echo 4. Ajout de tous les fichiers...
    git add .
    
    echo.
    echo 5. Creation du commit...
    set timestamp=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
    set timestamp=%timestamp: =0%
    git commit -m "Update: Corrections et ameliorations GeoPressCI - %timestamp%"
    
    echo.
    echo 6. Push vers GitHub...
    git push origin main
    
    echo.
    echo =======================================
    echo MISE A JOUR TERMINEE AVEC SUCCES!
    echo =======================================
) else (
    echo.
    echo OPERATION ANNULEE
)

echo.
pause
