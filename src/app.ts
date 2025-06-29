import express from 'express';
import path from 'path';
import cors from 'cors';
import AnalizadorLexico from './analizador/lexico';
import AnalizadorSintactico from './analizador/sintactico';
import Transpilador from './traduccion/transpilador';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para analizar código
app.post('/analizar', (req, res) => {
    const { codigo } = req.body;

    if (!codigo || typeof codigo !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Código fuente requerido'
        });
    }

    try {
        console.log('Iniciando análisis léxico...');
        
        // Análisis léxico
        const lexico = new AnalizadorLexico(codigo);
        const resultadoLexico = lexico.analizar();

        if (resultadoLexico.errores.length > 0) {
            console.log(`Errores léxicos encontrados: ${resultadoLexico.errores.length}`);
            return res.json({
                success: false,
                tipo: 'lexico',
                errores: resultadoLexico.errores,
                tokens: resultadoLexico.tokens
            });
        }

        console.log(`Tokens encontrados: ${resultadoLexico.tokens.length}`);
        console.log('Iniciando análisis sintáctico...');

        // Análisis sintáctico
        const sintactico = new AnalizadorSintactico(resultadoLexico.tokens);
        const resultadoSintactico = sintactico.analizar();

        if (resultadoSintactico.errores.length > 0) {
            console.log(`Errores sintácticos encontrados: ${resultadoSintactico.errores.length}`);
            return res.json({
                success: false,
                tipo: 'sintactico',
                errores: resultadoSintactico.errores,
                tokens: resultadoLexico.tokens
            });
        }

        console.log('Análisis sintáctico completado. Iniciando transpilación...');

        // Transpilación
        let codigoTypeScript = '';
        if (resultadoSintactico.ast) {
            codigoTypeScript = Transpilador.transpilar(resultadoSintactico.ast);
        }

        console.log('Transpilación completada exitosamente');

        res.json({
            success: true,
            tokens: resultadoLexico.tokens,
            ast: resultadoSintactico.ast,
            codigoTypeScript: codigoTypeScript
        });

    } catch (error) {
        console.error('Error durante el análisis:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

// Ruta para obtener información del sistema
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Transpilador C# a TypeScript',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Manejo global de errores
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error no manejado:', error);
    
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos estáticos desde: ${path.join(__dirname, '../public')}`);
    console.log(`🕒 Iniciado: ${new Date().toLocaleString()}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Cerrando servidor...');
    process.exit(0);
});

export default app;
