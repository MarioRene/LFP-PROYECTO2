import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import transpilerRoutes from './routes/transpiler';

/**
 * Servidor Express para el Transpilador C# a TypeScript
 */
class Server {
    private app: Application;
    private port: number;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3000');
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * Configura los middlewares
     */
    private initializeMiddlewares(): void {
        // CORS
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'],
            credentials: true
        }));

        // Body parser
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Archivos estáticos
        this.app.use(express.static(path.join(__dirname, '../public')));

        // Logging middleware
        this.app.use((req: Request, res: Response, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Configura las rutas
     */
    private initializeRoutes(): void {
        // Ruta principal - servir la aplicación web
        this.app.get('/', (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // API routes
        this.app.use('/api', transpilerRoutes);

        // Ruta 404
        this.app.use('*', (req: Request, res: Response) => {
            res.status(404).json({
                success: false,
                message: 'Ruta no encontrada',
                path: req.originalUrl
            });
        });
    }

    /**
     * Manejo de errores global
     */
    private initializeErrorHandling(): void {
        this.app.use((err: Error, req: Request, res: Response, next: any) => {
            console.error('Error no manejado:', err);
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
            });
        });
    }

    /**
     * Inicia el servidor
     */
    public start(): void {
        this.app.listen(this.port, () => {
            console.log('🚀 ===============================================');
            console.log('🔄 Transpilador C# a TypeScript');
            console.log('🚀 ===============================================');
            console.log(`🌐 Servidor corriendo en: http://localhost:${this.port}`);
            console.log(`📝 API disponible en: http://localhost:${this.port}/api`);
            console.log(`💻 Interfaz web en: http://localhost:${this.port}`);
            console.log('🚀 ===============================================');
            console.log(`📅 Iniciado: ${new Date().toLocaleString()}`);
            console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
            console.log('🚀 ===============================================');
        });
    }

    /**
     * Obtiene la instancia de Express
     */
    public getApp(): Application {
        return this.app;
    }
}

// Crear e iniciar el servidor
const server = new Server();
server.start();

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT. Cerrando servidor...');
    process.exit(0);
});

export default server;
