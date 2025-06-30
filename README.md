# 🔄 Transpilador C# a TypeScript

**Autor:** Mario Merida  
**Versión:** 2.0.4

Transpilador que convierte código C# a TypeScript con analizadores léxico y sintáctico implementados desde cero.

## 🚀 Inicio Rápido

### 📋 Requisitos
- **Node.js** v16+ ([Descargar aquí](https://nodejs.org/))
- **npm** (incluido con Node.js)

### 🔧 Instalación

1. **Descargar/clonar el proyecto**
   ```bash
   # Si tienes Git
   git clone <tu-repositorio>
   cd csharp-typescript-transpiler
   
   # O descomprimir el ZIP descargado
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Compilar TypeScript**
   ```bash
   npm run build
   ```

### ▶️ Ejecutar

#### Modo Desarrollo (Recomendado)
```bash
npm run dev
```

#### Modo Producción
```bash
npm start
```

### 🌐 Usar la Aplicación

1. **Abrir navegador**: `http://localhost:3000`
2. **Verificar estado**: Debe mostrar "Online" en verde
3. **Probar**: Usar el código de ejemplo y presionar "🔍 ANALIZAR"

## 📁 Estructura del Proyecto

```
├── src/                    # Código fuente TypeScript
│   ├── lexer/             # Analizador léxico
│   ├── parser/            # Analizador sintáctico
│   ├── models/            # Tipos y clases
│   └── server.ts          # Servidor principal
├── public/                # Interfaz web
├── examples/              # Ejemplos de código C#
└── docs/                  # Documentación
```

## 🎯 Funcionalidades

- ✅ **Análisis léxico** (tokens)
- ✅ **Análisis sintáctico** (gramática)
- ✅ **Traducción C# → TypeScript**
- ✅ **Ejecución de Console.WriteLine()**
- ✅ **Reportes de errores**
- ✅ **Tabla de símbolos**

## 🐛 Solución de Problemas

### Error: "command not found: node"
```bash
# Instalar Node.js desde https://nodejs.org/
node --version  # Verificar instalación
```

### Error: "Port 3000 is already in use"
```bash
# Cambiar puerto
PORT=3001 npm run dev
```

### Error de compilación TypeScript
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentación Completa

- **Manual de Usuario**: `docs/MANUAL_USUARIO.md`
- **Manual Técnico**: `docs/MANUAL_TECNICO.md`
- **Guía de Instalación**: `INSTALACION.md`

## 🧪 Probar con Ejemplos

Cargar archivos de la carpeta `examples/`:
- `test_basic.cs` - Código básico válido
- `test_errors.cs` - Código con errores para probar

---
