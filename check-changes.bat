@echo off
echo ===========================================
echo GEOPRESS-CI WEB - VERIFICATION MODIFICATIONS
echo ===========================================

cd /d "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

echo.
echo 1. Etat Git actuel:
echo -------------------
git status

echo.
echo 2. Fichiers modifies (non commites):
echo ------------------------------------
git diff --name-only

echo.
echo 3. Fichiers ajoutes a l'index:
echo ------------------------------
git diff --cached --name-only

echo.
echo 4. Derniers commits:
echo -------------------
git log --oneline -5

echo.
echo 5. Remote repository:
echo --------------------
git remote -v

echo.
echo 6. Branch actuelle:
echo ------------------
git branch

echo.
echo ===========================================
echo VERIFICATION TERMINEE
echo ===========================================
pause
