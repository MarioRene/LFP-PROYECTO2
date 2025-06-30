import { Router } from 'express';
import { TranspilerController } from '../controllers/TranspilerController';

const router = Router();

/**
 * @route POST /api/analyze
 * @desc Analiza código C# completo (léxico + sintáctico)
 * @body { code: string }
 */
router.post('/analyze', TranspilerController.analyzeCode);

/**
 * @route POST /api/lexical
 * @desc Análisis léxico únicamente
 * @body { code: string }
 */
router.post('/lexical', TranspilerController.lexicalAnalysis);

/**
 * @route POST /api/syntax
 * @desc Análisis sintáctico únicamente
 * @body { tokens: Token[] }
 */
router.post('/syntax', TranspilerController.syntaxAnalysis);

/**
 * @route GET /api/health
 * @desc Endpoint de salud del servicio
 */
router.get('/health', TranspilerController.healthCheck);

export default router;
