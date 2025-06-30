# Manual de Usuario - Transpilador C# a TypeScript

**Autor:** Mario Merida  
**Versión:** 2.0.4

## Introducción

El **Transpilador C# a TypeScript** convierte código C# a TypeScript automáticamente, incluye análisis léxico y sintáctico, y ejecuta instrucciones `Console.WriteLine()`.

## Inicio Rápido

1. **Abrir navegador**: `http://localhost:3000`
2. **Verificar estado**: Indicador "Online" en verde
3. **Analizar código**: Presionar botón **"🔍 ANALIZAR"** con el ejemplo precargado

## Interfaz de Usuario

### Barra de Navegación
- **📊 Token Report**: Tabla de tokens reconocidos
- **⚠️ Error Report**: Tabla de errores encontrados
- **🗑️ Limpiar Editor**: Limpia el contenido
- **📂 Cargar Archivo**: Carga archivos `.cs`
- **💾 Guardar Archivo**: Guarda como `.cs`

### Áreas Principales
- **Editor C#** (izquierda): Escribir código fuente
- **Salida TypeScript** (derecha): Código traducido
- **Consola** (inferior izquierda): Resultado de `Console.WriteLine()`
- **Tabla de Símbolos** (inferior derecha): Variables declaradas

## Lenguaje Soportado

### Tipos de Datos
| C# | TypeScript | Ejemplo |
|----|------------|---------|
| `int` | `number` | `int edad = 25;` |
| `float` | `number` | `float precio = 19.99f;` |
| `string` | `string` | `string nombre = "Juan";` |
| `char` | `string` | `char inicial = 'J';` |
| `bool` | `boolean` | `bool activo = true;` |

### Operadores
- **Aritméticos**: `+`, `-`, `*`, `/`
- **Relacionales**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Precedencia**: `()` > `*`, `/` > `+`, `-` > Relacionales

### Estructuras de Control
```csharp
// If-Else
if (condicion) { ... } else { ... }

// For
for (int i = 0; i < n; i++) { ... }
```

### Entrada/Salida
```csharp
Console.WriteLine("Mensaje"); // Imprime en consola
```

## Uso Básico

### Escribir Código Nuevo
1. **Limpiar** (opcional): Clic en "🗑️ Limpiar Editor"
2. **Escribir código**:
   ```csharp
   using System;
   
   public class MiPrograma
   {
       static void Main(string[] args)
       {
           int numero = 42;
           Console.WriteLine("Número: " + numero);
       }
   }
   ```
3. **Analizar**: Clic en "🔍 ANALIZAR"
4. **Revisar**: Código TypeScript y salida de consola

### Cargar Archivo
1. **Preparar archivo** con extensión `.cs`
2. **Cargar**: Clic en "📂 Cargar Archivo"
3. **Analizar**: Clic en "🔍 ANALIZAR"

### Interpretar Reportes

#### Token Report
Lista de elementos reconocidos:
- **Fila/Columna**: Posición del token
- **Lexema**: Texto exacto
- **Token**: Tipo identificado

#### Error Report
Lista de errores encontrados:
- **Léxicos**: Caracteres no reconocidos
- **Sintácticos**: Estructura incorrecta

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Carácter desconocido" | Caracteres inválidos | Usar solo ASCII válido |
| "Se esperaba [TOKEN]" | Sintaxis incorrecta | Verificar llaves/paréntesis |
| "String no terminada" | Falta comilla | Cerrar strings correctamente |
| "Variable no declarada" | Uso sin declarar | Declarar antes de usar |

## Estructura Recomendada

```csharp
using System;

public class MiClase
{
    static void Main(string[] args)
    {
        // 1. Declaraciones
        int numero;
        string texto = "Hola";
        
        // 2. Asignaciones
        numero = 42;
        
        // 3. Lógica
        if (numero > 0)
        {
            Console.WriteLine("Positivo: " + numero);
        }
        
        // 4. Bucles
        for (int i = 0; i < 3; i++)
        {
            Console.WriteLine("Iteración: " + i);
        }
    }
}
```

---

*Manual de Usuario - Transpilador C# a TypeScript v2.0.4 - Mario Merida*