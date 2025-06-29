interface NodoAST {
    tipo: string;
    [key: string]: any;
}

class AnalizadorSintactico {
    private tokens: any[];
    private posicion: number = 0;
    private errores: any[] = [];

    constructor(tokens: any[]) {
        this.tokens = tokens;
    }

    public analizar(): { ast: NodoAST | null, errores: any[] } {
        try {
            const ast = this.parseProgram();
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

    private parseProgram(): NodoAST {
        const blockUsing = this.parseBlockUsing();
        const classNode = this.parseClass();

        return {
            tipo: 'PROGRAMA',
            blockUsing: blockUsing,
            class: classNode
        };
    }

    private parseBlockUsing(): NodoAST {
        this.expect('USING');
        this.expect('SYSTEM');
        this.expect('PUNTO_COMA');

        return {
            tipo: 'BLOCK_USING'
        };
    }

    private parseClass(): NodoAST {
        this.expect('PUBLIC');
        this.expect('CLASS');
        const className = this.expect('IDENTIFICADOR');
        this.expect('LLAVE_IZQ');
        const blockMain = this.parseBlockMain();
        this.expect('LLAVE_DER');

        return {
            tipo: 'CLASE',
            nombre: className.valor,
            blockMain: blockMain
        };
    }

    private parseBlockMain(): NodoAST {
        this.expect('STATIC');
        this.expect('VOID');
        this.expect('MAIN');
        this.expect('PARENTESIS_IZQ');
        this.expect('STRING_TYPE');
        this.expect('CORCHETE_IZQ');
        this.expect('CORCHETE_DER');
        const args = this.expect('IDENTIFICADOR');
        this.expect('PARENTESIS_DER');
        this.expect('LLAVE_IZQ');
        const instrucciones = this.parseListaInstrucciones();
        this.expect('LLAVE_DER');

        return {
            tipo: 'BLOCK_MAIN',
            args: args.valor,
            instrucciones: instrucciones
        };
    }

    private parseListaInstrucciones(): NodoAST[] {
        const instrucciones: NodoAST[] = [];

        while (this.posicion < this.tokens.length && 
              this.tokens[this.posicion].tipo !== 'LLAVE_DER') {
            
            const instruccion = this.parseInstruction();
            instrucciones.push(instruccion);
        }

        return instrucciones;
    }

    private parseInstruction(): NodoAST {
        const token = this.tokens[this.posicion];

        switch (token.tipo) {
            case 'INT_TYPE':
            case 'FLOAT_TYPE':
            case 'CHAR_TYPE':
            case 'BOOL_TYPE':
            case 'STRING_TYPE':
                return this.parseDeclaracion();
            case 'IDENTIFICADOR':
                // Verificar si es una asignación o una llamada a Console.WriteLine
                if (this.posicion + 1 < this.tokens.length && 
                    this.tokens[this.posicion + 1].tipo === 'OPERADOR' && 
                    this.tokens[this.posicion + 1].valor === '=') {
                    
                    return this.parseAsignacion();
                } else if (token.valor === 'Console' && 
                          this.posicion + 1 < this.tokens.length && 
                          this.tokens[this.posicion + 1].tipo === 'PUNTO') {
                    
                    return this.parseImprimir();
                } else {
                    throw new Error(`Instrucción no reconocida en línea ${token.fila}`);
                }
            case 'IF':
                return this.parseIf();
            case 'FOR':
                return this.parseFor();
            default:
                throw new Error(`Instrucción no reconocida en línea ${token.fila}`);
        }
    }

    private parseDeclaracion(): NodoAST {
        const tipo = this.expect(
            ['INT_TYPE', 'FLOAT_TYPE', 'CHAR_TYPE', 'BOOL_TYPE', 'STRING_TYPE']
        );
        const listaId = this.parseListaID();
        this.expect('PUNTO_COMA');

        return {
            tipo: 'DECLARACION',
            tipoVariable: tipo.tipo,
            variables: listaId
        };
    }

    private parseListaID(): any[] {
        const variables = [];
        variables.push(this.parseIdAsig());

        while (this.posicion < this.tokens.length && 
              this.tokens[this.posicion].tipo === 'COMA') {
            
            this.expect('COMA');
            variables.push(this.parseIdAsig());
        }

        return variables;
    }

    private parseIdAsig(): any {
        const id = this.expect('IDENTIFICADOR');
        let expresion = null;

        if (this.posicion < this.tokens.length && 
            this.tokens[this.posicion].tipo === 'OPERADOR' && 
            this.tokens[this.posicion].valor === '=') {
            
            this.expect('OPERADOR');
            expresion = this.parseExpresion();
        }

        return {
            id: id.valor,
            expresion: expresion
        };
    }

    private parseAsignacion(): NodoAST {
        const id = this.expect('IDENTIFICADOR');
        this.expect('OPERADOR');
        const expresion = this.parseExpresion();
        this.expect('PUNTO_COMA');

        return {
            tipo: 'ASIGNACION',
            id: id.valor,
            expresion: expresion
        };
    }

    private parseImprimir(): NodoAST {
        this.expect('IDENTIFICADOR'); // Console
        this.expect('PUNTO');
        this.expect('IDENTIFICADOR'); // WriteLine
        this.expect('PARENTESIS_IZQ');
        const expresion = this.parseExpresion();
        this.expect('PARENTESIS_DER');
        this.expect('PUNTO_COMA');

        return {
            tipo: 'IMPRIMIR',
            expresion: expresion
        };
    }

    private parseIf(): NodoAST {
        this.expect('IF');
        this.expect('PARENTESIS_IZQ');
        const condicion = this.parseExpresion();
        this.expect('PARENTESIS_DER');
        this.expect('LLAVE_IZQ');
        const instrucciones = this.parseListaInstrucciones();
        this.expect('LLAVE_DER');

        let elseNode = null;
        if (this.posicion < this.tokens.length && this.tokens[this.posicion].tipo === 'ELSE') {
            this.expect('ELSE');
            this.expect('LLAVE_IZQ');
            const elseInstrucciones = this.parseListaInstrucciones();
            this.expect('LLAVE_DER');
            
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
        this.expect('FOR');
        this.expect('PARENTESIS_IZQ');
        
        // Primer bloque: declaración o asignación
        let primerBloque;
        if (this.tokens[this.posicion].tipo === 'INT_TYPE') {
            primerBloque = this.parseDeclaracion();
            // Eliminar el punto y coma final ya que en el for no lleva
            if (primerBloque.tipo === 'DECLARACION') {
                primerBloque = {
                    ...primerBloque,
                    puntoComa: false
                };
            }
        } else {
            primerBloque = this.parseAsignacion();
            // Eliminar el punto y coma final ya que en el for no lleva
            if (primerBloque.tipo === 'ASIGNACION') {
                primerBloque = {
                    ...primerBloque,
                    puntoComa: false
                };
            }
        }
        
        this.expect('PUNTO_COMA');
        
        // Segundo bloque: condición
        const condicion = this.parseExpresion();
        this.expect('PUNTO_COMA');
        
        // Tercer bloque: incremento/decremento
        const id = this.expect('IDENTIFICADOR');
        let operacion;
        if (this.tokens[this.posicion].valor === '++') {
            this.expect('OPERADOR');
            operacion = 'INCREMENTO';
        } else if (this.tokens[this.posicion].valor === '--') {
            this.expect('OPERADOR');
            operacion = 'DECREMENTO';
        } else {
            throw new Error(`Operación no válida en for en línea ${this.tokens[this.posicion].fila}`);
        }
        
        this.expect('PARENTESIS_DER');
        this.expect('LLAVE_IZQ');
        const instrucciones = this.parseListaInstrucciones();
        this.expect('LLAVE_DER');

        return {
            tipo: 'FOR',
            inicializacion: primerBloque,
            condicion: condicion,
            actualizacion: {
                id: id.valor,
                operacion: operacion
            },
            instrucciones: instrucciones
        };
    }

    private parseExpresion(): NodoAST {
        const aritmetica = this.parseAritmetica();
        
        if (this.posicion < this.tokens.length && 
            this.tokens[this.posicion].tipo === 'OPERADOR' && 
            ['==', '!=', '<', '>', '<=', '>='].includes(this.tokens[this.posicion].valor)) {
            
            const operador = this.expect('OPERADOR');
            const derecha = this.parseAritmetica();
            
            return {
                tipo: 'EXPRESION_RELACIONAL',
                izquierda: aritmetica,
                operador: operador.valor,
                derecha: derecha
            };
        }
        
        return aritmetica;
    }

    private parseAritmetica(): NodoAST {
        let nodo = this.parseTermino();
        
        while (this.posicion < this.tokens.length && 
              this.tokens[this.posicion].tipo === 'OPERADOR' && 
              ['+', '-'].includes(this.tokens[this.posicion].valor)) {
            
            const operador = this.expect('OPERADOR');
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
        
        while (this.posicion < this.tokens.length && 
              this.tokens[this.posicion].tipo === 'OPERADOR' && 
              ['*', '/'].includes(this.tokens[this.posicion].valor)) {
            
            const operador = this.expect('OPERADOR');
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
        if (this.tokens[this.posicion].tipo === 'PARENTESIS_IZQ') {
            this.expect('PARENTESIS_IZQ');
            const expresion = this.parseAritmetica();
            this.expect('PARENTESIS_DER');
            return expresion;
        } else if (this.tokens[this.posicion].tipo === 'IDENTIFICADOR') {
            const id = this.expect('IDENTIFICADOR');
            return {
                tipo: 'IDENTIFICADOR',
                valor: id.valor
            };
        } else if (this.tokens[this.posicion].tipo === 'ENTERO') {
            const num = this.expect('ENTERO');
            return {
                tipo: 'NUMERO',
                valor: num.valor,
                tipoNumero: 'ENTERO'
            };
        } else if (this.tokens[this.posicion].tipo === 'DECIMAL') {
            const num = this.expect('DECIMAL');
            return {
                tipo: 'NUMERO',
                valor: num.valor,
                tipoNumero: 'DECIMAL'
            };
        } else if (this.tokens[this.posicion].tipo === 'CARACTER') {
            const char = this.expect('CARACTER');
            return {
                tipo: 'CARACTER',
                valor: char.valor
            };
        } else if (this.tokens[this.posicion].tipo === 'CADENA') {
            const str = this.expect('CADENA');
            return {
                tipo: 'CADENA',
                valor: str.valor
            };
        } else if (this.tokens[this.posicion].tipo === 'BOOLEAN') {
            const bool = this.expect('BOOLEAN');
            return {
                tipo: 'BOOLEAN',
                valor: bool.valor === 'true'
            };
        } else {
            throw new Error(`Factor no reconocido en línea ${this.tokens[this.posicion].fila}`);
        }
    }

    private expect(tiposEsperados: string | string[]): any {
        if (this.posicion >= this.tokens.length) {
            const errorMsg = tiposEsperados instanceof Array ? 
                `Se esperaba uno de: ${tiposEsperados.join(', ')}` : 
                `Se esperaba: ${tiposEsperados}`;
            
            throw new Error(`${errorMsg} pero se alcanzó el final del archivo`);
        }

        const tokenActual = this.tokens[this.posicion];
        let tipoCoincide = false;

        if (typeof tiposEsperados === 'string') {
            tipoCoincide = tokenActual.tipo === tiposEsperados;
        } else {
            tipoCoincide = tiposEsperados.includes(tokenActual.tipo);
        }

        if (tipoCoincide) {
            this.posicion++;
            return tokenActual;
        } else {
            const errorMsg = tiposEsperados instanceof Array ? 
                `Se esperaba uno de: ${tiposEsperados.join(', ')}` : 
                `Se esperaba: ${tiposEsperados}`;
            
            const error = {
                fila: tokenActual.fila,
                columna: tokenActual.columna,
                encontrado: tokenActual.tipo,
                esperado: tiposEsperados,
                descripcion: `Error de sintaxis: ${errorMsg} pero se encontró ${tokenActual.tipo}`
            };
            
            this.errores.push(error);
            throw new Error(error.descripcion);
        }
    }
}

export default AnalizadorSintactico;
