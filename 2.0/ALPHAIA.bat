::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFDxRQxKDMm6GIroL5uT07u6UnkwRGus8d+8=
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSDk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSDk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJGyX8VAjFDxRQxKDMm6GIroL5uT07u6UnkwRROo+NorD39Q=
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off
ECHO ===========================================
ECHO   INICIANDO SERVIDOR NODE.JS (server.js)
ECHO ===========================================

:: Define a variavel LOCAL_DIR como o caminho do diretorio onde este .bat esta.
SET LOCAL_DIR=%~dp0

:: 1. Navega para o diretorio onde o .bat esta (a pasta raiz do projeto)
CD "%LOCAL_DIR%"

:: 2. Executa o server.js.
:: O comando START abre uma nova janela de terminal.
:: CMD /K executa o comando e MANTEM a janela aberta para ver a saida do Express.
start "Servidor Node.js (Backend)" cmd /K node server.cjs

ECHO.
ECHO O SERVIDOR NODE.JS FOI INICIADO NA PORTA 3000.
ECHO.
@echo off
ECHO =======================================
ECHO   INICIANDO SERVIDOR PYTHON (IA.py)
ECHO =======================================

:: Define o caminho do executavel Python 3.11 (ONDE O TORCH ESTA INSTALADO)
SET PYTHON_EXE="C:\Users\Geovane\AppData\Local\Programs\Python\Python311\python.exe"

:: Define a variavel LOCAL_DIR como o caminho do diretorio onde este .bat esta.
SET LOCAL_DIR=%~dp0

:: 1. Navega para o diretorio onde o .bat esta (a pasta raiz do projeto)
CD "%LOCAL_DIR%"

:: 2. Executa o IA.py, FORCANDO O USO DO PYTHON COM TORCH INSTALADO.
start "Servidor Python IA" cmd /K %PYTHON_EXE% IA.py

ECHO.
ECHO O SERVIDOR IA.py FOI INICIADO NA PORTA 5000.
ECHO.

ECHO =========================================================
ECHO   AMBOS OS SERVIDORES FORAM INICIADOS COM SUCESSO!
ECHO   AGUARDE 5 SEGUNDOS E O NAVEGADOR ABRIRA.
ECHO =========================================================

:: Abre a pagina inicial no navegador padrao
TIMEOUT /T 5 /NOBREAK
start http://localhost:3000/login.html
PAUSE
EXIT