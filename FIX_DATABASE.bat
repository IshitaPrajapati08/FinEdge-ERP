@echo off
echo.
echo ===================================================
echo  Fixing Database Schema - Adding Debit/Credit
echo ===================================================
echo.

cd /d "%~dp0backend"

echo [1/3] Running database migration...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo.
    echo Migration failed! Trying with push instead...
    call npx prisma db push --accept-data-loss
)

echo.
echo [2/3] Regenerating Prisma Client...
call npx prisma generate

echo.
echo [3/3] Restarting backend (if running)...
timeout /t 2

echo.
echo ===================================================
echo  Database fixed! Debit and Credit fields added.
echo ===================================================
echo.
echo  Now restart your backend server:
echo  cd backend
echo  npm start
echo.
pause
