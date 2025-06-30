import { Request, Response } from 'express';
import { LexicalAnalyzer } from '../lexer/LexicalAnalyzer';
import { SyntaxAnalyzer } from '../parser/SyntaxAnalyzer';

/**
 * Controlador principal del transpilador
 */
export class TranspilerController {
    
    /**
     * Analiza código C# y retorna tokens, errores, símbolos y traducción
     */
    public static analyzeCode(req: Request, res: Response): void {
        try {
            const { code } = req.body;
            
            if (!code || typeof code !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'El código C# es requerido'
                });
                return;
            }

            // Análisis léxico
            const lexer = new LexicalAnalyzer(code);
            const lexicalResult = lexer.analyze();

            // Análisis sintáctico
            const parser = new SyntaxAnalyzer(lexicalResult.tokens);
            const syntaxResult = parser.parseProgram();

            // Respuesta combinada
            const response = {
                success: true,
                lexical: {
                    tokens: lexicalResult.tokens,
                    errors: lexicalResult.errors
                },
                syntax: {
                    symbols: syntaxResult.symbols,
                    errors: syntaxResult.errors,
                    consoleOutput: syntaxResult.consoleOutput,
                    translatedCode: syntaxResult.translatedCode,
                    success: syntaxResult.success
                },
                summary: {
                    totalTokens: lexicalResult.tokens.length,
                    lexicalErrors: lexicalResult.errors.length,
                    syntaxErrors: syntaxResult.errors.length,
                    totalSymbols: syntaxResult.symbols.length,
                    hasErrors: lexicalResult.errors.length > 0 || syntaxResult.errors.length > 0
                }
            };

            res.json(response);

        } catch (error) {
            console.error('Error en el análisis:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Solo análisis léxico
     */
    public static lexicalAnalysis(req: Request, res: Response): void {
        try {
            const { code } = req.body;
            
            if (!code || typeof code !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'El código C# es requerido'
                });
                return;
            }

            const lexer = new LexicalAnalyzer(code);
            const result = lexer.analyze();

            res.json({
                success: true,
                tokens: result.tokens,
                errors: result.errors,
                summary: {
                    totalTokens: result.tokens.length,
                    totalErrors: result.errors.length
                }
            });

        } catch (error) {
            console.error('Error en análisis léxico:', error);
            res.status(500).json({
                success: false,
                message: 'Error en análisis léxico',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Solo análisis sintáctico (requiere tokens válidos)
     */
    public static syntaxAnalysis(req: Request, res: Response): void {
        try {
            const { tokens } = req.body;
            
            if (!tokens || !Array.isArray(tokens)) {
                res.status(400).json({
                    success: false,
                    message: 'Los tokens son requeridos'
                });
                return;
            }

            const parser = new SyntaxAnalyzer(tokens);
            const result = parser.parseProgram();

            res.json({
                success: true,
                symbols: result.symbols,
                errors: result.errors,
                consoleOutput: result.consoleOutput,
                translatedCode: result.translatedCode,
                parseSuccess: result.success,
                summary: {
                    totalSymbols: result.symbols.length,
                    totalErrors: result.errors.length,
                    consoleOutputLines: result.consoleOutput.length
                }
            });

        } catch (error) {
            console.error('Error en análisis sintáctico:', error);
            res.status(500).json({
                success: false,
                message: 'Error en análisis sintáctico',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Endpoint de salud del servicio
     */
    public static healthCheck(req: Request, res: Response): void {
        res.json({
            success: true,
            message: 'Transpilador C# a TypeScript funcionando correctamente',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    }
}
