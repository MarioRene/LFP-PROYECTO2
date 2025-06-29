import AnalizadorLexico from '../analizador/lexico';
import AnalizadorSintactico from '../analizador/sintactico';
import Transpilador from '../traduccion/transpilador';
import TablaSimbolos from '../modelos/simbolos';
import GeneradorReportes from '../reportes/errores';

class Editor {
    private editorElement: HTMLTextAreaElement;
    private salidaElement: HTMLTextAreaElement;
    private consolaElement: HTMLDivElement;
    private tablaSimbolosElement: HTMLTableElement;
    private lineNumbersElement: HTMLDivElement;
    private btnAnalizar: HTMLButtonElement;
    private btnCargar: HTMLButtonElement;
    private btnGuardar: HTMLButtonElement;
    private btnLimpiar: HTMLButtonElement;
    private btnGuardarTs: HTMLButtonElement;
    private btnReporteTokens: HTMLButtonElement;
    private btnReporteErrores: HTMLButtonElement;
    private btnClearConsole: HTMLButtonElement;
    private modalOverlay: HTMLDivElement;
    private modalTitle: HTMLHeadingElement;
    private modalContent: HTMLIFrameElement;
    private modalClose: HTMLButtonElement;
    private loadingOverlay: HTMLDivElement;
    private toastContainer: HTMLDivElement;
    private tablaSimbolos: TablaSimbolos;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialExample();
        this.updateLineNumbers();
        this.tablaSimbolos = new TablaSimbolos();
    }

    private initializeElements(): void {
        this.editorElement = document.getElementById('editor') as HTMLTextAreaElement;
        this.salidaElement = document.getElementById('salida') as HTMLTextAreaElement;
        this.consolaElement = document.getElementById('consola') as HTMLDivElement;
        this.tablaSimbolosElement = document.getElementById('tabla-simbolos') as HTMLTableElement;
        this.lineNumbersElement = document.getElementById('line-numbers') as HTMLDivElement;
        
        // Botones
        this.btnAnalizar = document.getElementById('btn-analizar') as HTMLButtonElement;
        this.btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
        this.btnGuardar = document.getElementById('btn-guardar') as HTMLButtonElement;
        this.btnLimpiar = document.getElementById('btn-limpiar') as HTMLButtonElement;
        this.btnGuardarTs = document.getElementById('btn-guardar-ts') as HTMLButtonElement;
        this.btnReporteTokens = document.getElementById('btn-reporte-tokens') as HTMLButtonElement;
        this.btnReporteErrores = document.getElementById('btn-reporte-errores') as HTMLButtonElement;
        this.btnClearConsole = document.getElementById('btn-clear-console') as HTMLButtonElement;
        
        // Modal
        this.modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
        this.modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
        this.modalContent = document.getElementById('modal-content') as HTMLIFrameElement;
        this.modalClose = document.getElementById('modal-close') as HTMLButtonElement;
        
        // Loading
        this.loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement;
        
        // Toast container
        this.toastContainer = document.getElementById('toast-container') as HTMLDivElement;
    }

    private setupEventListeners(): void {
        this.btnAnalizar.addEventListener('click', () => this.analizarCodigo());
        this.btnCargar.addEventListener('click', () => this.cargarArchivo());
        this.btnGuardar.addEventListener('click', () => this.guardarArchivo(false));
        this.btnLimpiar.addEventListener('click', () => this.limpiarEditor());
        this.btnGuardarTs.addEventListener('click', () => this.guardarArchivo(true));
        this.btnReporteTokens.addEventListener('click', () => this.mostrarReporteTokens());
        this.btnReporteErrores.addEventListener('click', () => this.mostrarReporteErrores());
        this.btnClearConsole.addEventListener('click', () => this.limpiarConsola());
        
        // Modal
        this.modalClose.addEventListener('click', () => this.cerrarModal());
        this.modalOverlay.addEventListener('click', (e: Event) => {
            if (e.target === this.modalOverlay) {
                this.cerrarModal();
            }
        });
        
        // Editor events
        this.editorElement.addEventListener('input', () => this.updateLineNumbers());
        this.editorElement.addEventListener('scroll', () => this.syncLineNumbers());
    }

    private loadInitialExample(): void {
        const ejemplo = `using System;

public class MyProgram {
    static void Main(string[] args) {
        // Declaración de variables
        int a = 10, b = 5;
        float precio = 42.99;
        string nombre = "Juan";
        bool activo = true;
        
        // Operaciones aritméticas
        int suma = a + b;
        
        // Sentencia if
        if (a > b) {
            Console.WriteLine("a es mayor que b");
        } else {
            Console.WriteLine("a no es mayor que b");
        }
        
        // Sentencia for
        for (int i = 0; i < 5; i++) {
            Console.WriteLine("Iteración: " + i);
        }
    }
}`;

        this.editorElement.value = ejemplo;
        this.updateLineNumbers();
    }

    private updateLineNumbers(): void {
        const lines = this.editorElement.value.split('\n').length;
        let lineNumbers = '';
        for (let i = 1; i <= lines; i++) {
            lineNumbers += i + '\n';
        }
        this.lineNumbersElement.textContent = lineNumbers;
    }

    private syncLineNumbers(): void {
        this.lineNumbersElement.scrollTop = this.editorElement.scrollTop;
    }

    private showLoading(): void {
        this.loadingOverlay.classList.remove('hidden');
    }

    private hideLoading(): void {
        this.loadingOverlay.classList.add('hidden');
    }

    private showToast(message: string, type: string = 'success'): void {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    private async analizarCodigo(): Promise<void> {
        const codigo = this.editorElement.value.trim();
        
        if (!codigo) {
            this.showToast('Por favor, ingresa código para analizar', 'warning');
            return;
        }

        this.showLoading();
        this.limpiarResultados();
        
        setTimeout(async () => {
            try {
                // Análisis léxico
                const lexico = new AnalizadorLexico(codigo);
                const resultadoLexico = lexico.analizar();
                
                this.logToConsole('Iniciando análisis léxico...', 'success');
                
                if (resultadoLexico.errores.length > 0) {
                    this.logToConsole(`Errores léxicos encontrados: ${resultadoLexico.errores.length}`, 'error');
                    this.mostrarErrores(resultadoLexico.errores);
                    this.hideLoading();
                    return;
                }
                
                this.logToConsole(`Tokens encontrados: ${resultadoLexico.tokens.length}`, 'success');
                
                // Análisis sintáctico
                this.logToConsole('Iniciando análisis sintáctico...', 'success');
                const sintactico = new AnalizadorSintactico(resultadoLexico.tokens);
                const resultadoSintactico = sintactico.analizar();
                
                if (resultadoSintactico.errores.length > 0) {
                    this.logToConsole(`Errores sintácticos encontrados: ${resultadoSintactico.errores.length}`, 'error');
                    this.mostrarErrores(resultadoSintactico.errores);
                    this.hideLoading();
                    return;
                }
                
                this.logToConsole('Análisis sintáctico completado exitosamente', 'success');
                
                // Transpilación
                if (resultadoSintactico.ast) {
                    this.logToConsole('Iniciando transpilación...', 'success');
                    const codigoTypeScript = Transpilador.transpilar(resultadoSintactico.ast);
                    this.salidaElement.value = codigoTypeScript;
                    this.logToConsole('Transpilación completada exitosamente', 'success');
                    
                    // Actualizar tabla de símbolos
                    this.actualizarTablaSimbolos(resultadoSintactico.ast);
                    
                    this.showToast('Análisis completado exitosamente');
                }
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                this.logToConsole(`Error inesperado: ${errorMessage}`, 'error');
                this.showToast('Error durante el análisis', 'error');
            } finally {
                this.hideLoading();
            }
        }, 100);
    }

    private logToConsole(mensaje: string, tipo: string = 'success'): void {
        const elemento = document.createElement('div');
        elemento.className = tipo;
        elemento.textContent = `[${new Date().toLocaleTimeString()}] ${mensaje}`;
        this.consolaElement.appendChild(elemento);
        this.consolaElement.scrollTop = this.consolaElement.scrollHeight;
    }

    private limpiarConsola(): void {
        this.consolaElement.innerHTML = '';
    }

    private limpiarResultados(): void {
        this.salidaElement.value = '';
        this.limpiarTablaSimbolos();
        this.tablaSimbolos = new TablaSimbolos();
    }

    private mostrarErrores(errores: any[]): void {
        errores.forEach(error => {
            this.logToConsole(
                `Error en línea ${error.fila}, columna ${error.columna}: ${error.descripcion}`,
                'error'
            );
        });
    }

    private actualizarTablaSimbolos(ast: any): void {
        this.limpiarTablaSimbolos();
        
        if (ast && ast.class && ast.class.blockMain && ast.class.blockMain.instrucciones) {
            ast.class.blockMain.instrucciones.forEach((instruccion: any) => {
                if (instruccion.tipo === 'DECLARACION') {
                    instruccion.variables.forEach((variable: any) => {
                        const tipo = this.convertirTipo(instruccion.tipoVariable);
                        const valor = variable.expresion ? this.evaluarExpresion(variable.expresion) : 'undefined';
                        
                        this.tablaSimbolos.agregar(variable.id, tipo, valor);
                        this.agregarFilaTablaSimbolos(variable.id, tipo, valor, 'global');
                    });
                } else if (instruccion.tipo === 'ASIGNACION') {
                    const simbolo = this.tablaSimbolos.buscar(instruccion.id);
                    if (simbolo) {
                        const nuevoValor = this.evaluarExpresion(instruccion.expresion);
                        this.tablaSimbolos.actualizar(instruccion.id, nuevoValor);
                        this.actualizarFilaTablaSimbolos(instruccion.id, nuevoValor);
                    }
                }
            });
        }
    }

    private convertirTipo(tipoCSharp: string): 'number' | 'string' | 'boolean' | 'any' {
        switch (tipoCSharp) {
            case 'INT_TYPE':
            case 'FLOAT_TYPE':
                return 'number';
            case 'STRING_TYPE':
            case 'CHAR_TYPE':
                return 'string';
            case 'BOOL_TYPE':
                return 'boolean';
            default:
                return 'any';
        }
    }

    private evaluarExpresion(expresion: any): any {
        if (!expresion) return 'undefined';

        switch (expresion.tipo) {
            case 'NUMERO':
                return expresion.valor;
            case 'CADENA':
                return `"${expresion.valor}"`;
            case 'CARACTER':
                return `'${expresion.valor}'`;
            case 'BOOLEAN':
                return expresion.valor ? 'true' : 'false';
            case 'IDENTIFICADOR':
                const simbolo = this.tablaSimbolos.buscar(expresion.valor);
                return simbolo ? simbolo.valor : 'undefined';
            case 'EXPRESION_ARITMETICA':
                const izq = this.evaluarExpresion(expresion.izquierda);
                const der = this.evaluarExpresion(expresion.derecha);
                return `(${izq} ${expresion.operador} ${der})`;
            default:
                return 'undefined';
        }
    }

    private agregarFilaTablaSimbolos(nombre: string, tipo: string, valor: any, ambito: string): void {
        const tbody = this.tablaSimbolosElement.querySelector('tbody') as HTMLTableSectionElement;
        const fila = tbody.insertRow();
        
        fila.insertCell(0).textContent = nombre;
        fila.insertCell(1).textContent = tipo;
        fila.insertCell(2).textContent = String(valor);
        fila.insertCell(3).textContent = ambito;
    }

    private actualizarFilaTablaSimbolos(nombre: string, nuevoValor: any): void {
        const tbody = this.tablaSimbolosElement.querySelector('tbody') as HTMLTableSectionElement;
        for (let i = 0; i < tbody.rows.length; i++) {
            if (tbody.rows[i].cells[0].textContent === nombre) {
                tbody.rows[i].cells[2].textContent = String(nuevoValor);
                break;
            }
        }
    }

    private limpiarTablaSimbolos(): void {
        const tbody = this.tablaSimbolosElement.querySelector('tbody') as HTMLTableSectionElement;
        while (tbody.rows.length > 0) {
            tbody.deleteRow(0);
        }
    }

    private cargarArchivo(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.cs';

        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.editorElement.value = event.target?.result as string;
                    this.updateLineNumbers();
                    this.showToast(`Archivo "${file.name}" cargado exitosamente`);
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    private guardarArchivo(esTypeScript: boolean): void {
        const contenido = esTypeScript ? this.salidaElement.value : this.editorElement.value;
        
        if (!contenido.trim()) {
            this.showToast('No hay contenido para guardar', 'warning');
            return;
        }

        const nombreArchivo = prompt('Ingrese el nombre del archivo:', 'programa');
        if (!nombreArchivo) return;

        const extension = esTypeScript ? '.ts' : '.cs';
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = nombreArchivo + extension;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast(`Archivo "${nombreArchivo}${extension}" guardado exitosamente`);
    }

    private limpiarEditor(): void {
        this.editorElement.value = '';
        this.salidaElement.value = '';
        this.limpiarConsola();
        this.limpiarTablaSimbolos();
        this.updateLineNumbers();
        this.showToast('Editor limpiado');
    }

    private mostrarReporteTokens(): void {
        const codigo = this.editorElement.value.trim();
        
        if (!codigo) {
            this.showToast('Por favor, ingresa código para generar el reporte', 'warning');
            return;
        }

        const lexico = new AnalizadorLexico(codigo);
        const resultado = lexico.analizar();

        const reporteHTML = GeneradorReportes.generarReporteTokens(resultado.tokens);
        this.mostrarModal('Reporte de Tokens', reporteHTML);
    }

    private mostrarReporteErrores(): void {
        const codigo = this.editorElement.value.trim();
        
        if (!codigo) {
            this.showToast('Por favor, ingresa código para generar el reporte', 'warning');
            return;
        }

        const lexico = new AnalizadorLexico(codigo);
        const resultado = lexico.analizar();

        if (resultado.errores.length === 0) {
            this.showToast('No se encontraron errores léxicos');
            return;
        }

        const reporteHTML = GeneradorReportes.generarReporteErrores(resultado.errores);
        this.mostrarModal('Reporte de Errores', reporteHTML);
    }

    private mostrarModal(titulo: string, contenidoHTML: string): void {
        this.modalTitle.textContent = titulo;
        this.modalContent.srcdoc = contenidoHTML;
        this.modalOverlay.classList.remove('hidden');
    }

    private cerrarModal(): void {
        this.modalOverlay.classList.add('hidden');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Editor();
});

export default Editor;
