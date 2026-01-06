@echo off
echo.
echo ================================================
echo    WSR - Atualizacao Automatica de Dados
echo ================================================
echo.
echo [1/2] Buscando dados do YouTube...
node get_real_youtube_data.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao buscar dados do YouTube
    pause
    exit /b 1
)

echo.
echo [2/2] Executando update_website.js...
node update_website.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] update_website.js nao executado ou com erro
)

echo.
echo ================================================
echo    Atualizacao Completa!
echo ================================================
echo.
echo Dados atualizados:
echo   - youtube_data.json
echo   - artist_stats.json  
echo   - index.html
echo   - js/script.js
echo.
echo Para atualizar novamente, execute: update_data.bat
echo.
pause
