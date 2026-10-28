@echo off
rem Inicia o Document Management System (backend + frontend).
rem
rem Uso: execute este arquivo a partir da raiz do repositorio clonado.
rem Se copiar para a area de trabalho, ajuste a variavel DMS_HOME abaixo
rem com o caminho completo do repositorio (ou crie um atalho para este .bat).

setlocal

rem Por padrao usa a pasta onde este .bat esta localizado.
set "DMS_HOME=%~dp0"
rem Exemplo se copiado para a area de trabalho:
rem set "DMS_HOME=C:\projetos\document-management-system-marcus-pinto\"

if not exist "%DMS_HOME%backend\package.json" (
    echo [ERRO] Repositorio nao encontrado em "%DMS_HOME%".
    echo Ajuste a variavel DMS_HOME neste arquivo com o caminho do repositorio.
    pause
    exit /b 1
)

echo Iniciando o backend na porta 3000...
start "DMS Backend" cmd /k "cd /d "%DMS_HOME%backend" && (if not exist node_modules npm install) && npm start"

echo Iniciando o frontend (Vite)...
start "DMS Frontend" cmd /k "cd /d "%DMS_HOME%frontend" && (if not exist node_modules npm install) && npm run dev"

echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo Feche as janelas abertas para encerrar o sistema.

endlocal
