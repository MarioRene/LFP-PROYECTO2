// src/traduccion/transpilador.ts

class Transpilador {
    static transpilar(ast: any): string {
        let codigoTypeScript = '';

        // Transpilar el bloque using (no es necesario en TypeScript)
        // Transpilar la clase
        codigoTypeScript += Transpilador.transpilarClase(ast.class);

        return codigoTypeScript;
    }

    private static transpilarClase(claseNode: any): string {
        let codigo = '';

        // En TypeScript no necesitamos la clase Main para código simple
        // Solo transpilamos el contenido del método Main
        if (claseNode.blockMain && claseNode.blockMain.instrucciones) {
            for (const instruccion of claseNode.blockMain.instrucciones) {
                codigo += Transpilador.transpilarInstruccion(instruccion);
            }
        }

        return codigo;
    }

    private static transpilarInstruccion(instruccion: any): string {
        switch (instruccion.tipo) {
            case 'DECLARACION':
                return this.transpilarDeclaracion(instruccion) + '\n';
            case 'ASIGNACION':
                return this.transpilarAsignacion(instruccion) + '\n';
            case 'IMPRIMIR':
                return this.transpilarImprimir(instruccion) + '\n';
            case 'IF':
                return this.transpilarIf(instruccion) + '\n';
            case 'FOR':
                return this.transpilarFor(instruccion) + '\n';
            default:
                return '';
        }
    }

    private static transpilarDeclaracion(declaracion: any): string {
        let tipoTypeScript = '';
        
        switch (declaracion.tipoVariable) {
            case 'INT_TYPE':
            case 'FLOAT_TYPE':
                tipoTypeScript = 'number';
                break;
            case 'STRING_TYPE':
                tipoTypeScript = 'string';
                break;
            case 'CHAR_TYPE':
                tipoTypeScript = 'string'; // TypeScript no tiene tipo char
                break;
            case 'BOOL_TYPE':
                tipoTypeScript = 'boolean';
                break;
            default:
                tipoTypeScript = 'any';
        }

        let codigo = `let `;
        const variables = [];

        for (const variable of declaracion.variables) {
            let varCode = `${variable.id}: ${tipoTypeScript}`;
            
            if (variable.expresion) {
                varCode += ` = ${this.transpilarExpresion(variable.expresion)}`;
            }
            
            variables.push(varCode);
        }

        codigo += variables.join(', ') + ';';
        return codigo;
    }

    private static transpilarAsignacion(asignacion: any): string {
        return `${asignacion.id} = ${this.transpilarExpresion(asignacion.expresion)};`;
    }

    private static transpilarImprimir(imprimir: any): string {
        return `console.log(${this.transpilarExpresion(imprimir.expresion)});`;
    }

    private static transpilarIf(ifNode: any): string {
        let codigo = `if (${this.transpilarExpresion(ifNode.condicion)}) {\n`;
        
        for (const instruccion of ifNode.instrucciones) {
            codigo += `    ${this.transpilarInstruccion(instruccion)}`;
        }
        
        codigo += '}';
        
        if (ifNode.else) {
            codigo += ' else {\n';
            for (const instruccion of ifNode.else.instrucciones) {
                codigo += `    ${this.transpilarInstruccion(instruccion)}`;
            }
            codigo += '}';
        }
        
        return codigo;
    }

    private static transpilarFor(forNode: any): string {
        let codigo = 'for (';
        
        // Primer bloque: inicialización
        if (forNode.inicializacion.tipo === 'DECLARACION') {
            const declaracion = forNode.inicializacion;
            let tipoTypeScript = '';
            
            switch (declaracion.tipoVariable) {
                case 'INT_TYPE':
                case 'FLOAT_TYPE':
                    tipoTypeScript = 'number';
                    break;
                case 'STRING_TYPE':
                    tipoTypeScript = 'string';
                    break;
                case 'CHAR_TYPE':
                    tipoTypeScript = 'string';
                    break;
                case 'BOOL_TYPE':
                    tipoTypeScript = 'boolean';
                    break;
                default:
                    tipoTypeScript = 'any';
            }
            
            const variables = [];
            for (const variable of declaracion.variables) {
                let varCode = `${variable.id}: ${tipoTypeScript}`;
                
                if (variable.expresion) {
                    varCode += ` = ${this.transpilarExpresion(variable.expresion)}`;
                }
                
                variables.push(varCode);
            }
            
            codigo += variables.join(', ');
        } else if (forNode.inicializacion.tipo === 'ASIGNACION') {
            codigo += `${forNode.inicializacion.id} = ${this.transpilarExpresion(forNode.inicializacion.expresion)}`;
        }
        
        codigo += '; ';
        
        // Segundo bloque: condición
        codigo += `${this.transpilarExpresion(forNode.condicion)}; `;
        
        // Tercer bloque: actualización
        codigo += `${forNode.actualizacion.id}${forNode.actualizacion.operacion === 'INCREMENTO' ? '++' : '--'}) {\n`;
        
        // Cuerpo del for
        for (const instruccion of forNode.instrucciones) {
            codigo += `    ${this.transpilarInstruccion(instruccion)}`;
        }
        
        codigo += '}';
        
        return codigo;
    }

    private static transpilarExpresion(expresion: any): string {
        if (!expresion) return '';
        
        switch (expresion.tipo) {
            case 'EXPRESION_RELACIONAL':
                return `${this.transpilarExpresion(expresion.izquierda)} ${expresion.operador} ${this.transpilarExpresion(expresion.derecha)}`;
            case 'EXPRESION_ARITMETICA':
                return `${this.transpilarExpresion(expresion.izquierda)} ${expresion.operador} ${this.transpilarExpresion(expresion.derecha)}`;
            case 'IDENTIFICADOR':
                return expresion.valor;
            case 'NUMERO':
                return expresion.valor;
            case 'CARACTER':
                return `'${expresion.valor}'`;
            case 'CADENA':
                return `"${expresion.valor}"`;
            case 'BOOLEAN':
                return expresion.valor ? 'true' : 'false';
            default:
                return '';
        }
    }
}

export default Transpilador;
