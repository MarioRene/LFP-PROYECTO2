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
    private btnAnalizar: HTMLButtonElement;
    private btnCargar: HTMLButtonElement;
    private btnGuardar: HTMLButtonElement;
    private btnLimpiar: HTMLButtonElement;
    private btnGuardarTs: HTMLButtonElement;
    private btnReporteTokens: HTMLButtonElement;
    private btnReporteErrores: HTMLButtonElement;
    private tablaSimbolos: TablaSimbolos;

    constructor() {
        this.editorElement = document.getElementById('editor') as HTMLTextAreaElement;
        this.salidaElement = document.getElementById('salida') as HTMLTextAreaElement;
        this.consolaElement = document.getElementById('consola') as HTMLDivElement;
        this.tablaSimbolosElement = document.getElementById('tabla-simbolos') as HTMLTableElement;
        this.btnAnalizar = document.getElementById('btn-analizar') as HTMLButtonElement;
        this.btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
        this.btnGuardar = document.getElementById('btn-guardar') as HTMLButtonElement;
        this.btnLimpiar = document.getElementById('btn-limpiar') as HTMLButtonElement;
        this.btnGuardarTs = document.getElementById('btn-guardar-ts') as HTMLButtonElement;
        this.btnReporteTokens = document.getElementById('btn-reporte-tokens') as HTMLButtonElement;
        this.btnReporteErrores = document.getElementById('btn-reporte-errores') as HTMLButtonElement;

        this.tablaSimbolos = new TablaSimbolos();

        // Event listeners
        this.btnAnalizar.addEventListener('click', () => this.analizarCodigo());
        this.btnCargar.addEventListener('click', () => this.cargarArchivo());
        this.btnGuardar.addEventListener('click', () => this.guardarArchivo(false));
        this.btnLimpiar.addEventListener('click', () => this.limpiarEditor());
        this.btnGuardarTs.addEventListener('click', () => this.guardarArchivo(true));
        this.btnReporteTokens.addEventListener('click', () => this.mostrarReporteTokens());
        this.btnReporteErrores.addEventListener('click', () => this.mostrarReporteErrores());

        // Cargar ejemplo inicial
        this.cargarEjemploInicial();
    }

    private cargarEjemploInicial() {
        const ejemplo = `using System;

public class MyProgram {
    static void Main(string[] args) {
        // Declaración de variables
        int a = 10, b = 5;
        float precio = 42.99f;
        string nombre = "Juan";
        bool activo = true;
        
        // Operaciones aritméticas
        int suma = a + b;
        float total = precio * 2;
        
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
    }

    private async analizarCodigo() {
        const codigo = this.editorElement.value;
        
        // Limpiar resultados anteriores
        this.salidaElement.value = '';
        this.consolaElement.innerHTML = '';
        this.limpiarTablaSimbolos();
        this.tablaSimbolos = new TablaSimbolos();

        try {
            // Mostrar mensaje de análisis en progreso
            this.consolaElement.innerHTML = '<div class="success">Analizando código...</div>';

            // Enviar código al backend para análisis
            const response = await fetch('http://localhost:3000/analizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codigo })
            });

            const resultado = await response.json();

            if (!resultado.success) {
                if (resultado.tipo === 'lexico') {
                    this.mostrarErrores(resultado.errores);
                } else if (resultado.tipo === 'sintactico') {
                    this.mostrarErrores(resultado.errores);
                } else {
                    this.consolaElement.innerHTML += `<div class="error">Error: ${resultado.error}</div>`;
                }
                return;
            }

            // Mostrar código transpilado
            this.salidaElement.value = resultado.codigoTypeScript;

            // Actualizar tabla de símbolos (simulación)
            this.actualizarTablaSimbolos(resultado.ast);

            // Mostrar mensaje de éxito
            this.consolaElement.innerHTML += '<div class="success">Análisis completado con éxito</div>';

        } catch (error) {
            this.consolaElement.innerHTML += `<div class="error">Error: ${error.message}</div>`;
        }
    }

    private mostrarErrores(errores: any[]) {
        for (const error of errores) {
            this.consolaElement.innerHTML += `
                <div class="error">
                    Error en línea ${error.fila}, columna ${error.columna}: ${error.descripcion}
                </div>
            `;
        }
    }

    private actualizarTablaSimbolos(ast: any) {
        // Esta es una implementación simplificada
        // En un proyecto real, se recorrería el AST para extraer las variables
        
        // Limpiar tabla
        this.limpiarTablaSimbolos();

        // Ejemplo de cómo se podrían agregar símbolos
        if (ast && ast.class && ast.class.blockMain && ast.class.blockMain.instrucciones) {
            ast.class.blockMain.instrucciones.forEach((instruccion: any) => {
                if (instruccion.tipo === 'DECLARACION') {
                    instruccion.variables.forEach((variable: any) => {
                        const tipo = this.convertirTipo(instruccion.tipoVariable);
                        this.tablaSimbolos.agregar(variable.id, tipo, variable.expresion ? this.evaluarExpresion(variable.expresion) : undefined);
                        this.agregarFilaTablaSimbolos(variable.id, tipo, variable.expresion ? this.evaluarExpresion(variable.expresion) : 'null', 'global');
                    });
                } else if (instruccion.tipo === 'ASIGNACION') {
                    const simbolo = this.tablaSimbolos.buscar(instruccion.id);
                    if (simbolo) {
                        const valor = this.evaluarExpresion(instruccion.expresion);
                        this.tablaSimbolos.actualizar(instruccion.id, valor);
                        this.actualizarFilaTablaSimbolos(instruccion.id, valor);
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
        // Implementación simplificada para evaluación de expresiones
        if (!expresion) return null;

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
                return simbolo ? simbolo.valor : 'null';
            case 'EXPRESION_ARITMETICA':
                const izquierda = this.evaluarExpresion(expresion.izquierda);
                const derecha = this.evaluarExpresion(expresion.derecha);
                return `(${izquierda} ${expresion.operador} ${derecha})`;
            default:
                return 'null';
        }
    }

    private agregarFilaTablaSimbolos(nombre: string, tipo: string, valor: any, ambito: string) {
        const tbody = this.tablaSimbolosElement.querySelector('tbody') as HTMLTableSectionElement;
        const fila = tbody.insertRow();
        
        fila.insertCell(0).textContent = nombre;
        fila.insertCell(1).textContent = tipo;
        fila.insertCell(2).textContent = valor !== undefined ? String(valor) : 'null';
        fila.insertCell(3).textContent = ambito;
    }

    private actualizarFilaTablaSimbolos(nombre: string, nuevoValor: any) {
        const tbody = this.tablaSimbolosElement.querySelector('tbody') as HTMLTableSectionElement;
        for (let i = 0; i < tbody.rows.length; i++) {
            if (tbody.rows[i].cells[0].textContent === nombre) {
                tbody.rows[i].cells[2].textContent = String(nuevoValor);
                break;
            }
        }
    }

    private limpiarTablaSimbolos() {
        const tbody = this.tablaSimbolosElement.querySelector('tbody') as HTMLTableSectionElement;
        while (tbody.rows.length > 0) {
            tbody.deleteRow(0);
        }
    }

    private cargarArchivo() {
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
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    private guardarArchivo(esTypeScript: boolean) {
        const contenido = esTypeScript ? this.salidaElement.value : this.editorElement.value;
        
        if (!contenido.trim()) {
            this.consolaElement.innerHTML += '<div class="error">No hay contenido para guardar</div>';
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
    }

    private limpiarEditor() {
        this.editorElement.value = '';
        this.salidaElement.value = '';
        this.consolaElement.innerHTML = '';
        this.limpiarTablaSimbolos();
    }

    private mostrarReporteTokens() {
        const codigo = this.editorElement.value;
        const lexico = new AnalizadorLexico(codigo);
        const resultado = lexico.analizar();

        const reporteHTML = GeneradorReportes.generarReporteTokens(resultado.tokens);
        this.mostrarDialogoReporte(reporteHTML, 'Reporte de Tokens');
    }

    private mostrarReporteErrores() {
        const codigo = this.editorElement.value;
        const lexico = new AnalizadorLexico(codigo);
        const resultado = lexico.analizar();

        if (resultado.errores.length === 0) {
            this.consolaElement.innerHTML += '<div class="success">No se encontraron errores léxicos</div>';
            return;
        }

        const reporteHTML = GeneradorReportes.generarReporteErrores(resultado.errores);
        this.mostrarDialogoReporte(reporteHTML, 'Reporte de Errores');
    }

    private mostrarDialogoReporte(contenidoHTML: string, titulo: string) {
        // Crear iframe para mostrar el reporte
        const iframe = document.createElement('iframe');
        iframe.srcdoc = contenidoHTML;

        // Crear diálogo
        const dialog = document.createElement('div');
        dialog.className = 'reporte-dialog';
        dialog.innerHTML = `<h2>${titulo}</h2>`;
        dialog.appendChild(iframe);

        // Botón para cerrar
        const btnCerrar = document.createElement('button');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.onclick = () => document.body.removeChild(dialog);
        dialog.appendChild(btnCerrar);

        // Agregar al documento
        document.body.appendChild(dialog);
    }
}

// Inicializar el editor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Editor();
});
