#!/bin/bash

# Script de configuración para el Transpilador C# a TypeScript
# Autor: Proyecto LFP - USAC

echo "🚀 ==============================================="
echo "🔄 Configurando Transpilador C# a TypeScript"
echo "🚀 ==============================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instale Node.js v16 o superior."
    echo "📥 Descargar desde: https://nodejs.org/"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "⚠️ Node.js versión $NODE_VERSION detectada. Se requiere v16 o superior."
    echo "📥 Actualizar desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js versión $NODE_VERSION detectada"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi

echo "✅ npm detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al compilar TypeScript"
    exit 1
fi

echo "✅ TypeScript compilado correctamente"

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

echo "✅ Directorios creados"

# Verificar archivos de configuración
echo "🔍 Verificando configuración..."

if [ ! -f "tsconfig.json" ]; then
    echo "❌ Archivo tsconfig.json no encontrado"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Archivo package.json no encontrado"
    exit 1
fi

echo "✅ Archivos de configuración verificados"

# Mostrar información del proyecto
echo ""
echo "📋 Información del Proyecto:"
echo "   Nombre: $(cat package.json | grep '"name"' | cut -d'"' -f4)"
echo "   Versión: $(cat package.json | grep '"version"' | cut -d'"' -f4)"
echo "   Node.js: $NODE_VERSION"
echo "   npm: $(npm -v)"

echo ""
echo "🎉 ==============================================="
echo "✅ Configuración completada exitosamente"
echo "🎉 ==============================================="
echo ""
echo "🚀 Para iniciar el servidor:"
echo "   npm run dev     (desarrollo con hot-reload)"
echo "   npm start       (producción)"
echo ""
echo "🌐 El servidor estará disponible en:"
echo "   http://localhost:3000"
echo ""
echo "📖 Documentación:"
echo "   Manual Usuario: docs/MANUAL_USUARIO.md"
echo "   Manual Técnico: docs/MANUAL_TECNICO.md"
echo ""