@echo off
REM Script de configuración para Windows
REM Transpilador C# a TypeScript - USAC

echo.
echo 🚀 ===============================================
echo 🔄 Configurando Transpilador C# a TypeScript
echo 🚀 ===============================================
echo.

REM Verificar si Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor, instale Node.js v16 o superior.
    echo 📥 Descargar desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado: 
node -v

REM Verificar si npm está instalado
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado.
    pause
    exit /b 1
)

echo ✅ npm detectado: 
npm -v

REM Instalar dependencias
echo.
echo 📦 Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas correctamente

REM Compilar TypeScript
echo.
echo 🔨 Compilando TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al compilar TypeScript
    pause
    exit /b 1
)

echo ✅ TypeScript compilado correctamente

REM Crear directorios necesarios
echo.
echo 📁 Creando directorios...
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "temp" mkdir temp

echo ✅ Directorios creados

REM Verificar archivos de configuración
echo.
echo 🔍 Verificando configuración...

if not exist "tsconfig.json" (
    echo ❌ Archivo tsconfig.json no encontrado
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ Archivo package.json no encontrado
    pause
    exit /b 1
)

echo ✅ Archivos de configuración verificados

echo.
echo 🎉 ===============================================
echo ✅ Configuración completada exitosamente
echo 🎉 ===============================================
echo.
echo 🚀 Para iniciar el servidor:
echo    npm run dev     (desarrollo con hot-reload)
echo    npm start       (producción)
echo.
echo 🌐 El servidor estará disponible en:
echo    http://localhost:3000
echo.
echo 📖 Documentación:
echo    Manual Usuario: docs\MANUAL_USUARIO.md
echo    Manual Técnico: docs\MANUAL_TECNICO.md
echo.
pause