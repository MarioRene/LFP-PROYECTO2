class Transpilador {
    static transpilar(ast: any): string {
        if (!ast || !ast.class || !ast.class.blockMain) {
            return '';
        }

        let codigo = '';
        const instrucciones = ast.class.blockMain.instrucciones;

        if (instrucciones && instrucciones.length > 0) {
            for (const instruccion of instrucciones) {
                codigo += this.transpilarInstruccion(instruccion);
            }
        }

        return codigo.trim();
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
        let tipoTypeScript = this.obtenerTipoTypeScript(declaracion.tipoVariable);

        let codigo = `let `;
        const variables = [];

        for (const variable of declaracion.variables) {
            let varCode = `${variable.id}: ${tipoTypeScript}`;
            
            if (variable.expresion) {
                varCode += ` = ${this.transpilarExpresion(variable.expresion)}`;
            } else {
                // Valor por defecto según el tipo
                const valorDefecto = this.obtenerValorPorDefecto(tipoTypeScript);
                if (valorDefecto !== null) {
                    varCode += ` = ${valorDefecto}`;
                }
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
            const instruccionCode = this.transpilarInstruccion(instruccion).trim();
            if (instruccionCode) {
                codigo += `    ${instruccionCode}\n`;
            }
        }
        
        codigo += '}';
        
        if (ifNode.else) {
            codigo += ' else {\n';
            for (const instruccion of ifNode.else.instrucciones) {
                const instruccionCode = this.transpilarInstruccion(instruccion).trim();
                if (instruccionCode) {
                    codigo += `    ${instruccionCode}\n`;
                }
            }
            codigo += '}';
        }
        
        return codigo;
    }

    private static transpilarFor(forNode: any): string {
        let codigo = 'for (';
        
        // Inicialización
        if (forNode.inicializacion.tipo === 'DECLARACION_FOR') {
            const tipoTypeScript = this.obtenerTipoTypeScript(forNode.inicializacion.tipoVariable);
            codigo += `let ${forNode.inicializacion.id}: ${tipoTypeScript} = ${this.transpilarExpresion(forNode.inicializacion.expresion)}`;
        } else if (forNode.inicializacion.tipo === 'ASIGNACION_FOR') {
            codigo += `${forNode.inicializacion.id} = ${this.transpilarExpresion(forNode.inicializacion.expresion)}`;
        }
        
        codigo += '; ';
        
        // Condición
        codigo += `${this.transpilarExpresion(forNode.condicion)}; `;
        
        // Actualización
        const operadorActualizacion = forNode.actualizacion.operacion === 'INCREMENTO' ? '++' : '--';
        codigo += `${forNode.actualizacion.id}${operadorActualizacion}) {\n`;
        
        // Cuerpo del for
        for (const instruccion of forNode.instrucciones) {
            const instruccionCode = this.transpilarInstruccion(instruccion).trim();
            if (instruccionCode) {
                codigo += `    ${instruccionCode}\n`;
            }
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
                const izq = this.transpilarExpresion(expresion.izquierda);
                const der = this.transpilarExpresion(expresion.derecha);
                
                // Manejar concatenación de strings
                if (expresion.operador === '+') {
                    return `${izq} + ${der}`;
                }
                return `${izq} ${expresion.operador} ${der}`;
            
            case 'IDENTIFICADOR':
                return expresion.valor;
            
            case 'NUMERO':
                return String(expresion.valor);
            
            case 'CARACTER':
                return `'${this.escaparCaracter(expresion.valor)}'`;
            
            case 'CADENA':
                return `"${this.escaparCadena(expresion.valor)}"`;
            
            case 'BOOLEAN':
                return expresion.valor ? 'true' : 'false';
            
            default:
                return '';
        }
    }

    private static obtenerTipoTypeScript(tipoCSharp: string): string {
        switch (tipoCSharp) {
            case 'INT_TYPE':
            case 'FLOAT_TYPE':
                return 'number';
            case 'STRING_TYPE':
                return 'string';
            case 'CHAR_TYPE':
                return 'string';
            case 'BOOL_TYPE':
                return 'boolean';
            default:
                return 'any';
        }
    }

    private static obtenerValorPorDefecto(tipoTypeScript: string): string | null {
        switch (tipoTypeScript) {
            case 'number':
                return '0';
            case 'string':
                return '""';
            case 'boolean':
                return 'false';
            default:
                return null;
        }
    }

    private static escaparCaracter(caracter: string): string {
        const caractereEspeciales: {[key: string]: string} = {
            '\\': '\\\\',
            '\'': '\\\'',
            '"': '\\"',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t'
        };
        
        return caractereEspeciales[caracter] || caracter;
    }

    private static escaparCadena(cadena: string): string {
        return cadena
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
}

export default Transpilador;
