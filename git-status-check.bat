@echo off
echo ===========================================
echo GEOPRESS-CI WEB - VERIFICATION ETAT GIT
echo ===========================================

cd /d "c:\Users\Saiyan13\Desktop\GEOPRESS-GIT\geopressci-web-master"

echo.
echo 1. Etat Git actuel:
echo ------------------
git status

echo.
echo 2. Branch actuelle:
echo ------------------
git branch

echo.
echo 3. Remote repository:
echo --------------------
git remote -v

echo.
echo 4. Fichiers modifies (non commites):
echo -----------------------------------
git diff --name-only

echo.
echo 5. Fichiers ajoutes a l'index:
echo ------------------------------
git diff --cached --name-only

echo.
echo 6. Fichiers non suivis:
echo ----------------------
git ls-files --others --exclude-standard

echo.
echo 7. Derniers commits:
echo -------------------
git log --oneline -5

echo.
echo 8. Statistiques des modifications:
echo ---------------------------------
git diff --stat

echo.
echo ===========================================
echo VERIFICATION TERMINEE
echo ===========================================
pause
