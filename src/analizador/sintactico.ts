interface NodoAST {
    tipo: string;
    [key: string]: any;
}

class AnalizadorSintactico {
    private tokens: any[];
    private posicion: number = 0;
    private errores: any[] = [];
    private tokenActual: any = null;

    constructor(tokens: any[]) {
        this.tokens = tokens.filter(token => 
            token.tipo !== 'COMENTARIO_LINEA' && 
            token.tipo !== 'COMENTARIO_BLOQUE'
        );
        this.tokenActual = this.tokens[0] || null;
    }

    public analizar(): { ast: NodoAST | null, errores: any[] } {
        this.errores = [];
        this.posicion = 0;
        this.tokenActual = this.tokens[0] || null;

        try {
            const ast = this.parsePrograma();
            return {
                ast: ast,
                errores: this.errores
            };
        } catch (error) {
            return {
                ast: null,
                errores: this.errores
            };
        }
    }

    private parsePrograma(): NodoAST {
        const blockUsing = this.parseBlockUsing();
        const classNode = this.parseClase();

        return {
            tipo: 'PROGRAMA',
            blockUsing: blockUsing,
            class: classNode
        };
    }

    private parseBlockUsing(): NodoAST {
        this.consumir('USING');
        this.consumir('SYSTEM');
        this.consumir('PUNTO_COMA');

        return {
            tipo: 'BLOCK_USING'
        };
    }

    private parseClase(): NodoAST {
        this.consumir('PUBLIC');
        this.consumir('CLASS');
        const className = this.consumir('IDENTIFICADOR');
        this.consumir('LLAVE_IZQ');
        const blockMain = this.parseBlockMain();
        this.consumir('LLAVE_DER');

        return {
            tipo: 'CLASE',
            nombre: className.valor,
            blockMain: blockMain
        };
    }

    private parseBlockMain(): NodoAST {
        this.consumir('STATIC');
        this.consumir('VOID');
        this.consumir('MAIN');
        this.consumir('PARENTESIS_IZQ');
        this.consumir('STRING_TYPE');
        this.consumir('CORCHETE_IZQ');
        this.consumir('CORCHETE_DER');
        const args = this.consumir('IDENTIFICADOR');
        this.consumir('PARENTESIS_DER');
        this.consumir('LLAVE_IZQ');
        const instrucciones = this.parseListaInstrucciones();
        this.consumir('LLAVE_DER');

        return {
            tipo: 'BLOCK_MAIN',
            args: args.valor,
            instrucciones: instrucciones
        };
    }

    private parseListaInstrucciones(): NodoAST[] {
        const instrucciones: NodoAST[] = [];

        while (this.tokenActual && this.tokenActual.tipo !== 'LLAVE_DER') {
            try {
                const instruccion = this.parseInstruccion();
                instrucciones.push(instruccion);
            } catch (error) {
                // Intentar recuperarse del error saltando al siguiente token
                this.avanzar();
                if (this.posicion >= this.tokens.length) break;
            }
        }

        return instrucciones;
    }

    private parseInstruccion(): NodoAST {
        if (!this.tokenActual) {
            throw new Error('Token inesperado: fin de archivo');
        }

        switch (this.tokenActual.tipo) {
            case 'INT_TYPE':
            case 'FLOAT_TYPE':
            case 'CHAR_TYPE':
            case 'BOOL_TYPE':
            case 'STRING_TYPE':
                return this.parseDeclaracion();
            
            case 'IDENTIFICADOR':
                return this.parseAsignacionOLlamada();
            
            case 'IF':
                return this.parseIf();
            
            case 'FOR':
                return this.parseFor();
            
            default:
                throw new Error(`Instrucción no reconocida: ${this.tokenActual.tipo} en línea ${this.tokenActual.fila}`);
        }
    }

    private parseAsignacionOLlamada(): NodoAST {
        if (this.tokenActual.valor === 'Console') {
            return this.parseImprimir();
        } else {
            return this.parseAsignacion();
        }
    }

    private parseDeclaracion(): NodoAST {
        const tipo = this.consumir(['INT_TYPE', 'FLOAT_TYPE', 'CHAR_TYPE', 'BOOL_TYPE', 'STRING_TYPE']);
        const listaId = this.parseListaID();
        this.consumir('PUNTO_COMA');

        return {
            tipo: 'DECLARACION',
            tipoVariable: tipo.tipo,
            variables: listaId
        };
    }

    private parseListaID(): any[] {
        const variables = [];
        variables.push(this.parseIdAsig());

        while (this.tokenActual && this.tokenActual.tipo === 'COMA') {
            this.consumir('COMA');
            variables.push(this.parseIdAsig());
        }

        return variables;
    }

    private parseIdAsig(): any {
        const id = this.consumir('IDENTIFICADOR');
        let expresion = null;

        if (this.tokenActual && 
            this.tokenActual.tipo === 'OPERADOR' && 
            this.tokenActual.valor === '=') {
            
            this.consumir('OPERADOR');
            expresion = this.parseExpresion();
        }

        return {
            id: id.valor,
            expresion: expresion
        };
    }

    private parseAsignacion(): NodoAST {
        const id = this.consumir('IDENTIFICADOR');
        
        if (!this.tokenActual || this.tokenActual.tipo !== 'OPERADOR' || this.tokenActual.valor !== '=') {
            throw new Error(`Se esperaba '=' después del identificador en línea ${id.fila}`);
        }
        
        this.consumir('OPERADOR');
        const expresion = this.parseExpresion();
        this.consumir('PUNTO_COMA');

        return {
            tipo: 'ASIGNACION',
            id: id.valor,
            expresion: expresion
        };
    }

    private parseImprimir(): NodoAST {
        this.consumir('IDENTIFICADOR'); // Console
        this.consumir('PUNTO');
        this.consumir('IDENTIFICADOR'); // WriteLine
        this.consumir('PARENTESIS_IZQ');
        const expresion = this.parseExpresion();
        this.consumir('PARENTESIS_DER');
        this.consumir('PUNTO_COMA');

        return {
            tipo: 'IMPRIMIR',
            expresion: expresion
        };
    }

    private parseIf(): NodoAST {
        this.consumir('IF');
        this.consumir('PARENTESIS_IZQ');
        const condicion = this.parseExpresion();
        this.consumir('PARENTESIS_DER');
        this.consumir('LLAVE_IZQ');
        const instrucciones = this.parseListaInstrucciones();
        this.consumir('LLAVE_DER');

        let elseNode = null;
        if (this.tokenActual && this.tokenActual.tipo === 'ELSE') {
            this.consumir('ELSE');
            this.consumir('LLAVE_IZQ');
            const elseInstrucciones = this.parseListaInstrucciones();
            this.consumir('LLAVE_DER');
            
            elseNode = {
                tipo: 'ELSE',
                instrucciones: elseInstrucciones
            };
        }

        return {
            tipo: 'IF',
            condicion: condicion,
            instrucciones: instrucciones,
            else: elseNode
        };
    }

    private parseFor(): NodoAST {
        this.consumir('FOR');
        this.consumir('PARENTESIS_IZQ');
        
        // Primer bloque: declaración o asignación
        let inicializacion;
        if (['INT_TYPE', 'FLOAT_TYPE', 'CHAR_TYPE', 'BOOL_TYPE', 'STRING_TYPE'].includes(this.tokenActual.tipo)) {
            const tipo = this.consumir(['INT_TYPE', 'FLOAT_TYPE', 'CHAR_TYPE', 'BOOL_TYPE', 'STRING_TYPE']);
            const id = this.consumir('IDENTIFICADOR');
            this.consumir('OPERADOR'); // =
            const expresion = this.parseExpresion();
            
            inicializacion = {
                tipo: 'DECLARACION_FOR',
                tipoVariable: tipo.tipo,
                id: id.valor,
                expresion: expresion
            };
        } else {
            const id = this.consumir('IDENTIFICADOR');
            this.consumir('OPERADOR'); // =
            const expresion = this.parseExpresion();
            
            inicializacion = {
                tipo: 'ASIGNACION_FOR',
                id: id.valor,
                expresion: expresion
            };
        }
        
        this.consumir('PUNTO_COMA');
        
        // Segundo bloque: condición
        const condicion = this.parseExpresion();
        this.consumir('PUNTO_COMA');
        
        // Tercer bloque: incremento/decremento
        const id = this.consumir('IDENTIFICADOR');
        const operadorToken = this.consumir('OPERADOR');
        
        let operacion;
        if (operadorToken.valor === '++') {
            operacion = 'INCREMENTO';
        } else if (operadorToken.valor === '--') {
            operacion = 'DECREMENTO';
        } else {
            throw new Error(`Operación no válida en for: ${operadorToken.valor} en línea ${operadorToken.fila}`);
        }
        
        this.consumir('PARENTESIS_DER');
        this.consumir('LLAVE_IZQ');
        const instrucciones = this.parseListaInstrucciones();
        this.consumir('LLAVE_DER');

        return {
            tipo: 'FOR',
            inicializacion: inicializacion,
            condicion: condicion,
            actualizacion: {
                id: id.valor,
                operacion: operacion
            },
            instrucciones: instrucciones
        };
    }

    private parseExpresion(): NodoAST {
        let nodo = this.parseTerminoRelacional();
        
        while (this.tokenActual && 
               this.tokenActual.tipo === 'OPERADOR' && 
               ['==', '!=', '<', '>', '<=', '>='].includes(this.tokenActual.valor)) {
            
            const operador = this.consumir('OPERADOR');
            const derecha = this.parseTerminoRelacional();
            
            nodo = {
                tipo: 'EXPRESION_RELACIONAL',
                izquierda: nodo,
                operador: operador.valor,
                derecha: derecha
            };
        }
        
        return nodo;
    }

    private parseTerminoRelacional(): NodoAST {
        let nodo = this.parseTermino();
        
        while (this.tokenActual && 
               this.tokenActual.tipo === 'OPERADOR' && 
               ['+', '-'].includes(this.tokenActual.valor)) {
            
            const operador = this.consumir('OPERADOR');
            const derecha = this.parseTermino();
            
            nodo = {
                tipo: 'EXPRESION_ARITMETICA',
                izquierda: nodo,
                operador: operador.valor,
                derecha: derecha
            };
        }
        
        return nodo;
    }

    private parseTermino(): NodoAST {
        let nodo = this.parseFactor();
        
        while (this.tokenActual && 
               this.tokenActual.tipo === 'OPERADOR' && 
               ['*', '/'].includes(this.tokenActual.valor)) {
            
            const operador = this.consumir('OPERADOR');
            const derecha = this.parseFactor();
            
            nodo = {
                tipo: 'EXPRESION_ARITMETICA',
                izquierda: nodo,
                operador: operador.valor,
                derecha: derecha
            };
        }
        
        return nodo;
    }

    private parseFactor(): NodoAST {
        if (!this.tokenActual) {
            throw new Error('Se esperaba un factor pero se encontró fin de archivo');
        }

        if (this.tokenActual.tipo === 'PARENTESIS_IZQ') {
            this.consumir('PARENTESIS_IZQ');
            const expresion = this.parseTerminoRelacional();
            this.consumir('PARENTESIS_DER');
            return expresion;
        } else if (this.tokenActual.tipo === 'IDENTIFICADOR') {
            const id = this.consumir('IDENTIFICADOR');
            return {
                tipo: 'IDENTIFICADOR',
                valor: id.valor
            };
        } else if (this.tokenActual.tipo === 'ENTERO') {
            const num = this.consumir('ENTERO');
            return {
                tipo: 'NUMERO',
                valor: parseInt(num.valor),
                tipoNumero: 'ENTERO'
            };
        } else if (this.tokenActual.tipo === 'DECIMAL') {
            const num = this.consumir('DECIMAL');
            return {
                tipo: 'NUMERO',
                valor: parseFloat(num.valor),
                tipoNumero: 'DECIMAL'
            };
        } else if (this.tokenActual.tipo === 'CARACTER') {
            const char = this.consumir('CARACTER');
            return {
                tipo: 'CARACTER',
                valor: char.valor
            };
        } else if (this.tokenActual.tipo === 'CADENA') {
            const str = this.consumir('CADENA');
            return {
                tipo: 'CADENA',
                valor: str.valor
            };
        } else if (this.tokenActual.tipo === 'BOOLEAN') {
            const bool = this.consumir('BOOLEAN');
            return {
                tipo: 'BOOLEAN',
                valor: bool.valor === 'true'
            };
        } else {
            throw new Error(`Factor no reconocido: ${this.tokenActual.tipo} en línea ${this.tokenActual.fila}`);
        }
    }

    private consumir(tiposEsperados: string | string[]): any {
        if (!this.tokenActual) {
            const errorMsg = Array.isArray(tiposEsperados) ? 
                `Se esperaba uno de: ${tiposEsperados.join(', ')}` : 
                `Se esperaba: ${tiposEsperados}`;
            
            const error = {
                fila: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].fila : 1,
                columna: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].columna : 1,
                encontrado: 'EOF',
                esperado: tiposEsperados,
                descripcion: `${errorMsg} pero se alcanzó el final del archivo`
            };
            
            this.errores.push(error);
            throw new Error(error.descripcion);
        }

        const tokenActual = this.tokenActual;
        let tipoCoincide = false;

        if (typeof tiposEsperados === 'string') {
            tipoCoincide = tokenActual.tipo === tiposEsperados;
        } else {
            tipoCoincide = tiposEsperados.includes(tokenActual.tipo);
        }

        if (tipoCoincide) {
            this.avanzar();
            return tokenActual;
        } else {
            const errorMsg = Array.isArray(tiposEsperados) ? 
                `Se esperaba uno de: ${tiposEsperados.join(', ')}` : 
                `Se esperaba: ${tiposEsperados}`;
            
            const error = {
                fila: tokenActual.fila,
                columna: tokenActual.columna,
                encontrado: tokenActual.tipo,
                esperado: tiposEsperados,
                descripcion: `${errorMsg} pero se encontró ${tokenActual.tipo} (${tokenActual.valor})`
            };
            
            this.errores.push(error);
            throw new Error(error.descripcion);
        }
    }

    private avanzar() {
        this.posicion++;
        this.tokenActual = this.posicion < this.tokens.length ? this.tokens[this.posicion] : null;
    }
}

export default AnalizadorSintactico;
