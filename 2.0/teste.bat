@echo off
ECHO ===========================================
ECHO   VERIFICANDO E INSTALANDO DEPENDENCIAS
ECHO ===========================================

:: Define a variavel LOCAL_DIR como o caminho do diretorio onde este .bat esta.
SET LOCAL_DIR=%~dp0

:: 1. Navega para o diretorio onde o .bat esta (a pasta raiz do projeto)
CD /D "%LOCAL_DIR%"

:: 2. Instala as dependencias Node.js (lendo o package.json)
ECHO Instalando dependencias Node.js (npm install)...
npm install

:: Adicione o comando 'pause' ou 'exit' aqui se quiser que o .bat pare após a instalacao.
pause
PAUSE