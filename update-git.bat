@echo off
echo ===========================================
echo GEOPRESS-CI WEB - MISE A JOUR GIT
echo ===========================================

cd /d "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

echo.
echo 1. Verification de l'etat Git...
git status

echo.
echo 2. Ajout de tous les fichiers modifies...
git add .

echo.
echo 3. Verification des fichiers ajoutes...
git status

echo.
echo 4. Creation du commit avec timestamp...
set timestamp=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
git commit -m "Update: Corrections et ameliorations GeoPressCI - %timestamp%"

echo.
echo 5. Push vers origin main...
git push origin main

echo.
echo ===========================================
echo MISE A JOUR TERMINEE
echo ===========================================
pause
