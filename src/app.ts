import express from 'express';
import path from 'path';
import AnalizadorLexico from './analizador/lexico.js';
import AnalizadorSintactico from './analizador/sintactico';
import Transpilador from './traduccion/transpilador';

const app = express();
const PORT = 3000;

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Ruta para analizar código
app.post('/analizar', (req, res) => {
    const { codigo } = req.body;

    try {
        // Análisis léxico
        const lexico = new AnalizadorLexico(codigo);
        const resultadoLexico = lexico.analizar();

        if (resultadoLexico.errores.length > 0) {
            return res.json({
                success: false,
                tipo: 'lexico',
                errores: resultadoLexico.errores
            });
        }

        // Análisis sintáctico
        const sintactico = new AnalizadorSintactico(resultadoLexico.tokens);
        const resultadoSintactico = sintactico.analizar();

        if (resultadoSintactico.errores.length > 0) {
            return res.json({
                success: false,
                tipo: 'sintactico',
                errores: resultadoSintactico.errores
            });
        }

        // Transpilación
        let codigoTypeScript = '';
        if (resultadoSintactico.ast) {
            codigoTypeScript = Transpilador.transpilar(resultadoSintactico.ast);
        }

        res.json({
            success: true,
            tokens: resultadoLexico.tokens,
            ast: resultadoSintactico.ast,
            codigoTypeScript: codigoTypeScript
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
