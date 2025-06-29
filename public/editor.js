// Analizador Léxico
class AnalizadorLexico {
    constructor(codigo) {
        this.codigoFuente = codigo;
        this.posicion = 0;
        this.fila = 1;
        this.columna = 1;
        this.tokens = [];
        this.errores = [];

        this.palabrasReservadas = {
            'using': 'USING',
            'System': 'SYSTEM',
            'public': 'PUBLIC',
            'class': 'CLASS',
            'static': 'STATIC',
            'void': 'VOID',
            'Main': 'MAIN',
            'string': 'STRING_TYPE',
            'int': 'INT_TYPE',
            'float': 'FLOAT_TYPE',
            'char': 'CHAR_TYPE',
            'bool': 'BOOL_TYPE',
            'true': 'BOOLEAN',
            'false': 'BOOLEAN',
            'if': 'IF',
            'else': 'ELSE',
            'for': 'FOR',
            'Console': 'CONSOLE',
            'WriteLine': 'WRITELINE'
        };
    }

    analizar() {
        this.tokens = [];
        this.errores = [];
        this.posicion = 0;
        this.fila = 1;
        this.columna = 1;

        while (this.posicion < this.codigoFuente.length) {
            const caracter = this.codigoFuente[this.posicion];

            if (this.esEspacio(caracter)) {
                this.avanzar();
            } else if (this.esSaltoLinea(caracter)) {
                this.fila++;
                this.columna = 1;
                this.avanzar();
            } else if (this.esDigito(caracter)) {
                this.analizarNumero();
            } else if (this.esLetra(caracter)) {
                this.analizarIdentificador();
            } else if (caracter === '"') {
                this.analizarCadena();
            } else if (caracter === "'") {
                this.analizarCaracter();
            } else if (caracter === '/' && this.codigoFuente[this.posicion + 1] === '/') {
                this.analizarComentarioLinea();
            } else if (caracter === '/' && this.codigoFuente[this.posicion + 1] === '*') {
                this.analizarComentarioBloque();
            } else if (this.esOperador(caracter)) {
                this.analizarOperador();
            } else if (this.esSimbolo(caracter)) {
                this.analizarSimbolo(caracter);
            } else {
                this.errores.push({
                    fila: this.fila,
                    columna: this.columna,
                    caracter: caracter,
                    descripcion: 'Carácter desconocido'
                });
                this.avanzar();
            }
        }

        return {
            tokens: this.tokens,
            errores: this.errores
        };
    }

    analizarNumero() {
        let valor = '';
        let esDecimal = false;
        let inicioColumna = this.columna;

        while (this.posicion < this.codigoFuente.length && 
              (this.esDigito(this.codigoFuente[this.posicion]) || 
              (this.codigoFuente[this.posicion] === '.' && !esDecimal))) {
            
            if (this.codigoFuente[this.posicion] === '.') {
                esDecimal = true;
            }
            
            valor += this.codigoFuente[this.posicion];
            this.avanzar();
        }

        this.tokens.push({
            tipo: esDecimal ? 'DECIMAL' : 'ENTERO',
            valor: valor,
            fila: this.fila,
            columna: inicioColumna
        });
    }

    analizarIdentificador() {
        let valor = '';
        let inicioColumna = this.columna;

        while (this.posicion < this.codigoFuente.length && 
              (this.esLetra(this.codigoFuente[this.posicion]) || 
               this.esDigito(this.codigoFuente[this.posicion]) || 
               this.codigoFuente[this.posicion] === '_')) {
            
            valor += this.codigoFuente[this.posicion];
            this.avanzar();
        }

        const tipo = this.palabrasReservadas[valor] || 'IDENTIFICADOR';
        this.tokens.push({
            tipo: tipo,
            valor: valor,
            fila: this.fila,
            columna: inicioColumna
        });
    }

    analizarCadena() {
        let valor = '';
        let inicioColumna = this.columna;
        this.avanzar(); // Saltar la comilla inicial

        while (this.posicion < this.codigoFuente.length && this.codigoFuente[this.posicion] !== '"') {
            if (this.esSaltoLinea(this.codigoFuente[this.posicion])) {
                this.fila++;
                this.columna = 1;
            }
            valor += this.codigoFuente[this.posicion];
            this.avanzar();
        }

        if (this.posicion < this.codigoFuente.length && this.codigoFuente[this.posicion] === '"') {
            this.avanzar(); // Saltar la comilla final
            this.tokens.push({
                tipo: 'CADENA',
                valor: valor,
                fila: this.fila,
                columna: inicioColumna
            });
        } else {
            this.errores.push({
                fila: this.fila,
                columna: inicioColumna,
                caracter: '"',
                descripcion: 'Cadena no cerrada'
            });
        }
    }

    analizarCaracter() {
        let valor = '';
        let inicioColumna = this.columna;
        this.avanzar(); // Saltar la comilla simple inicial

        if (this.posicion < this.codigoFuente.length && this.codigoFuente[this.posicion] !== "'") {
            valor = this.codigoFuente[this.posicion];
            this.avanzar();
        }

        if (this.posicion < this.codigoFuente.length && this.codigoFuente[this.posicion] === "'") {
            this.avanzar(); // Saltar la comilla simple final
            this.tokens.push({
                tipo: 'CARACTER',
                valor: valor,
                fila: this.fila,
                columna: inicioColumna
            });
        } else {
            this.errores.push({
                fila: this.fila,
                columna: inicioColumna,
                caracter: "'",
                descripcion: 'Carácter no cerrado correctamente'
            });
        }
    }

    analizarComentarioLinea() {
        let valor = '';
        let inicioColumna = this.columna;
        this.avanzar(); // Saltar el primer /
        this.avanzar(); // Saltar el segundo /

        while (this.posicion < this.codigoFuente.length && !this.esSaltoLinea(this.codigoFuente[this.posicion])) {
            valor += this.codigoFuente[this.posicion];
            this.avanzar();
        }

        this.tokens.push({
            tipo: 'COMENTARIO_LINEA',
            valor: valor.trim(),
            fila: this.fila,
            columna: inicioColumna
        });
    }

    analizarComentarioBloque() {
        let valor = '';
        let inicioColumna = this.columna;
        let inicioFila = this.fila;
        this.avanzar(); // Saltar el primer /
        this.avanzar(); // Saltar el *

        while (this.posicion < this.codigoFuente.length - 1 && 
              !(this.codigoFuente[this.posicion] === '*' && this.codigoFuente[this.posicion + 1] === '/')) {
            
            if (this.esSaltoLinea(this.codigoFuente[this.posicion])) {
                this.fila++;
                this.columna = 1;
                valor += this.codigoFuente[this.posicion];
                this.posicion++;
            } else {
                valor += this.codigoFuente[this.posicion];
                this.avanzar();
            }
        }

        if (this.posicion < this.codigoFuente.length - 1 && 
            this.codigoFuente[this.posicion] === '*' && this.codigoFuente[this.posicion + 1] === '/') {
            
            this.avanzar(); // Saltar el *
            this.avanzar(); // Saltar el /
            
            this.tokens.push({
                tipo: 'COMENTARIO_BLOQUE',
                valor: valor.trim(),
                fila: inicioFila,
                columna: inicioColumna
            });
        } else {
            this.errores.push({
                fila: inicioFila,
                columna: inicioColumna,
                caracter: '/*',
                descripcion: 'Comentario de bloque no cerrado'
            });
        }
    }

    analizarOperador() {
        const caracter = this.codigoFuente[this.posicion];
        const siguiente = this.posicion + 1 < this.codigoFuente.length ? this.codigoFuente[this.posicion + 1] : '';
        let operador = caracter;
        let inicioColumna = this.columna;

        // Verificar operadores de dos caracteres
        if ((caracter === '=' && siguiente === '=') ||
            (caracter === '!' && siguiente === '=') ||
            (caracter === '<' && siguiente === '=') ||
            (caracter === '>' && siguiente === '=') ||
            (caracter === '+' && siguiente === '+') ||
            (caracter === '-' && siguiente === '-')) {
            
            operador += siguiente;
            this.avanzar();
        }

        this.avanzar();
        this.tokens.push({
            tipo: 'OPERADOR',
            valor: operador,
            fila: this.fila,
            columna: inicioColumna
        });
    }

    analizarSimbolo(caracter) {
        const simbolos = {
            ';': 'PUNTO_COMA',
            '.': 'PUNTO',
            ',': 'COMA',
            '(': 'PARENTESIS_IZQ',
            ')': 'PARENTESIS_DER',
            '{': 'LLAVE_IZQ',
            '}': 'LLAVE_DER',
            '[': 'CORCHETE_IZQ',
            ']': 'CORCHETE_DER'
        };

        this.tokens.push({
            tipo: simbolos[caracter] || 'SIMBOLO',
            valor: caracter,
            fila: this.fila,
            columna: this.columna
        });

        this.avanzar();
    }

    avanzar() {
        this.posicion++;
        this.columna++;
    }

    esDigito(caracter) {
        return /[0-9]/.test(caracter);
    }

    esLetra(caracter) {
        return /[a-zA-Z]/.test(caracter);
    }

    esEspacio(caracter) {
        return /[ \t]/.test(caracter);
    }

    esSaltoLinea(caracter) {
        return caracter === '\n' || caracter === '\r';
    }

    esOperador(caracter) {
        return ['+', '-', '*', '/', '=', '!', '<', '>'].includes(caracter);
    }

    esSimbolo(caracter) {
        return [';', ',', '.', '{', '}', '(', ')', '[', ']'].includes(caracter);
    }
}

// Analizador Sintáctico
class AnalizadorSintactico {
    constructor(tokens) {
        this.tokens = tokens.filter(token => 
            token.tipo !== 'COMENTARIO_LINEA' && 
            token.tipo !== 'COMENTARIO_BLOQUE'
        );
        this.posicion = 0;
        this.errores = [];
        this.tokenActual = this.tokens[0] || null;
    }

    analizar() {
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

    parsePrograma() {
        const blockUsing = this.parseBlockUsing();
        const classNode = this.parseClase();

        return {
            tipo: 'PROGRAMA',
            blockUsing: blockUsing,
            class: classNode
        };
    }

    parseBlockUsing() {
        this.consumir('USING');
        this.consumir('SYSTEM');
        this.consumir('PUNTO_COMA');

        return {
            tipo: 'BLOCK_USING'
        };
    }

    parseClase() {
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

    parseBlockMain() {
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

    parseListaInstrucciones() {
        const instrucciones = [];

        while (this.tokenActual && this.tokenActual.tipo !== 'LLAVE_DER') {
            try {
                const instruccion = this.parseInstruccion();
                instrucciones.push(instruccion);
            } catch (error) {
                this.avanzar();
                if (this.posicion >= this.tokens.length) break;
            }
        }

        return instrucciones;
    }

    parseInstruccion() {
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

    parseAsignacionOLlamada() {
        if (this.tokenActual.valor === 'Console') {
            return this.parseImprimir();
        } else {
            return this.parseAsignacion();
        }
    }

    parseDeclaracion() {
        const tipo = this.consumir(['INT_TYPE', 'FLOAT_TYPE', 'CHAR_TYPE', 'BOOL_TYPE', 'STRING_TYPE']);
        const listaId = this.parseListaID();
        this.consumir('PUNTO_COMA');

        return {
            tipo: 'DECLARACION',
            tipoVariable: tipo.tipo,
            variables: listaId
        };
    }

    parseListaID() {
        const variables = [];
        variables.push(this.parseIdAsig());

        while (this.tokenActual && this.tokenActual.tipo === 'COMA') {
            this.consumir('COMA');
            variables.push(this.parseIdAsig());
        }

        return variables;
    }

    parseIdAsig() {
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

    parseAsignacion() {
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

    parseImprimir() {
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

    parseIf() {
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

    parseFor() {
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

    parseExpresion() {
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

    parseTerminoRelacional() {
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

    parseTermino() {
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

    parseFactor() {
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

    consumir(tiposEsperados) {
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

    avanzar() {
        this.posicion++;
        this.tokenActual = this.posicion < this.tokens.length ? this.tokens[this.posicion] : null;
    }
}

// Transpilador
class Transpilador {
    static transpilar(ast) {
        if (!ast || !ast.class || !ast.class.blockMain) {
            return '';
        }

        let codigo = '';
        const instrucciones = ast.class.blockMain.instrucciones;

        for (const instruccion of instrucciones) {
            codigo += this.transpilarInstruccion(instruccion);
        }

        return codigo;
    }

    static transpilarInstruccion(instruccion) {
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

    static transpilarDeclaracion(declaracion) {
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

    static transpilarAsignacion(asignacion) {
        return `${asignacion.id} = ${this.transpilarExpresion(asignacion.expresion)};`;
    }

    static transpilarImprimir(imprimir) {
        return `console.log(${this.transpilarExpresion(imprimir.expresion)});`;
    }

    static transpilarIf(ifNode) {
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

    static transpilarFor(forNode) {
        let codigo = 'for (';
        
        // Inicialización
        if (forNode.inicializacion.tipo === 'DECLARACION_FOR') {
            let tipoTypeScript = '';
            
            switch (forNode.inicializacion.tipoVariable) {
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
            
            codigo += `let ${forNode.inicializacion.id}: ${tipoTypeScript} = ${this.transpilarExpresion(forNode.inicializacion.expresion)}`;
        } else if (forNode.inicializacion.tipo === 'ASIGNACION_FOR') {
            codigo += `${forNode.inicializacion.id} = ${this.transpilarExpresion(forNode.inicializacion.expresion)}`;
        }
        
        codigo += '; ';
        
        // Condición
        codigo += `${this.transpilarExpresion(forNode.condicion)}; `;
        
        // Actualización
        codigo += `${forNode.actualizacion.id}${forNode.actualizacion.operacion === 'INCREMENTO' ? '++' : '--'}) {\n`;
        
        // Cuerpo del for
        for (const instruccion of forNode.instrucciones) {
            codigo += `    ${this.transpilarInstruccion(instruccion)}`;
        }
        
        codigo += '}';
        
        return codigo;
    }

    static transpilarExpresion(expresion) {
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

// Clase principal del Editor
class Editor {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialExample();
        this.updateLineNumbers();
        this.tablaSimbolos = new Map();
    }

    initializeElements() {
        this.editorElement = document.getElementById('editor');
        this.salidaElement = document.getElementById('salida');
        this.consolaElement = document.getElementById('consola');
        this.tablaSimbolosElement = document.getElementById('tabla-simbolos');
        this.lineNumbersElement = document.getElementById('line-numbers');
        
        // Botones
        this.btnAnalizar = document.getElementById('btn-analizar');
        this.btnCargar = document.getElementById('btn-cargar');
        this.btnGuardar = document.getElementById('btn-guardar');
        this.btnLimpiar = document.getElementById('btn-limpiar');
        this.btnGuardarTs = document.getElementById('btn-guardar-ts');
        this.btnReporteTokens = document.getElementById('btn-reporte-tokens');
        this.btnReporteErrores = document.getElementById('btn-reporte-errores');
        this.btnClearConsole = document.getElementById('btn-clear-console');
        
        // Modal
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalContent = document.getElementById('modal-content');
        this.modalClose = document.getElementById('modal-close');
        
        // Loading
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Toast container
        this.toastContainer = document.getElementById('toast-container');
    }

    setupEventListeners() {
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
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.cerrarModal();
            }
        });
        
        // Editor events
        this.editorElement.addEventListener('input', () => this.updateLineNumbers());
        this.editorElement.addEventListener('scroll', () => this.syncLineNumbers());
    }

    loadInitialExample() {
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

    updateLineNumbers() {
        const lines = this.editorElement.value.split('\n').length;
        let lineNumbers = '';
        for (let i = 1; i <= lines; i++) {
            lineNumbers += i + '\n';
        }
        this.lineNumbersElement.textContent = lineNumbers;
    }

    syncLineNumbers() {
        this.lineNumbersElement.scrollTop = this.editorElement.scrollTop;
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    analizarCodigo() {
        const codigo = this.editorElement.value.trim();
        
        if (!codigo) {
            this.showToast('Por favor, ingresa código para analizar', 'warning');
            return;
        }

        this.showLoading();
        this.limpiarResultados();
        
        setTimeout(() => {
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
                this.logToConsole(`Error inesperado: ${error.message}`, 'error');
                this.showToast('Error durante el análisis', 'error');
            } finally {
                this.hideLoading();
            }
        }, 100);
    }

    logToConsole(mensaje, tipo = 'success') {
        const elemento = document.createElement('div');
        elemento.className = tipo;
        elemento.textContent = `[${new Date().toLocaleTimeString()}] ${mensaje}`;
        this.consolaElement.appendChild(elemento);
        this.consolaElement.scrollTop = this.consolaElement.scrollHeight;
    }

    limpiarConsola() {
        this.consolaElement.innerHTML = '';
    }

    limpiarResultados() {
        this.salidaElement.value = '';
        this.limpiarTablaSimbolos();
        this.tablaSimbolos.clear();
    }

    mostrarErrores(errores) {
        errores.forEach(error => {
            this.logToConsole(
                `Error en línea ${error.fila}, columna ${error.columna}: ${error.descripcion}`,
                'error'
            );
        });
    }

    actualizarTablaSimbolos(ast) {
        this.limpiarTablaSimbolos();
        
        if (ast && ast.class && ast.class.blockMain && ast.class.blockMain.instrucciones) {
            ast.class.blockMain.instrucciones.forEach(instruccion => {
                if (instruccion.tipo === 'DECLARACION') {
                    instruccion.variables.forEach(variable => {
                        const tipo = this.convertirTipo(instruccion.tipoVariable);
                        const valor = variable.expresion ? this.evaluarExpresion(variable.expresion) : 'undefined';
                        
                        this.tablaSimbolos.set(variable.id, { tipo, valor });
                        this.agregarFilaTablaSimbolos(variable.id, tipo, valor, 'global');
                    });
                } else if (instruccion.tipo === 'ASIGNACION') {
                    if (this.tablaSimbolos.has(instruccion.id)) {
                        const simbolo = this.tablaSimbolos.get(instruccion.id);
                        const nuevoValor = this.evaluarExpresion(instruccion.expresion);
                        simbolo.valor = nuevoValor;
                        this.actualizarFilaTablaSimbolos(instruccion.id, nuevoValor);
                    }
                }
            });
        }
    }

    convertirTipo(tipoCSharp) {
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

    evaluarExpresion(expresion) {
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
                const simbolo = this.tablaSimbolos.get(expresion.valor);
                return simbolo ? simbolo.valor : 'undefined';
            case 'EXPRESION_ARITMETICA':
                const izq = this.evaluarExpresion(expresion.izquierda);
                const der = this.evaluarExpresion(expresion.derecha);
                return `(${izq} ${expresion.operador} ${der})`;
            default:
                return 'undefined';
        }
    }

    agregarFilaTablaSimbolos(nombre, tipo, valor, ambito) {
        const tbody = this.tablaSimbolosElement.querySelector('tbody');
        const fila = tbody.insertRow();
        
        fila.insertCell(0).textContent = nombre;
        fila.insertCell(1).textContent = tipo;
        fila.insertCell(2).textContent = String(valor);
        fila.insertCell(3).textContent = ambito;
    }

    actualizarFilaTablaSimbolos(nombre, nuevoValor) {
        const tbody = this.tablaSimbolosElement.querySelector('tbody');
        for (let i = 0; i < tbody.rows.length; i++) {
            if (tbody.rows[i].cells[0].textContent === nombre) {
                tbody.rows[i].cells[2].textContent = String(nuevoValor);
                break;
            }
        }
    }

    limpiarTablaSimbolos() {
        const tbody = this.tablaSimbolosElement.querySelector('tbody');
        while (tbody.rows.length > 0) {
            tbody.deleteRow(0);
        }
    }

    cargarArchivo() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.cs';

        input.onchange = (e) => {
            const file = e.target.files?.[0];
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.editorElement.value = event.target.result;
                    this.updateLineNumbers();
                    this.showToast(`Archivo "${file.name}" cargado exitosamente`);
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    guardarArchivo(esTypeScript) {
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

    limpiarEditor() {
        this.editorElement.value = '';
        this.salidaElement.value = '';
        this.limpiarConsola();
        this.limpiarTablaSimbolos();
        this.updateLineNumbers();
        this.showToast('Editor limpiado');
    }

    mostrarReporteTokens() {
        const codigo = this.editorElement.value.trim();
        
        if (!codigo) {
            this.showToast('Por favor, ingresa código para generar el reporte', 'warning');
            return;
        }

        const lexico = new AnalizadorLexico(codigo);
        const resultado = lexico.analizar();

        const reporteHTML = this.generarReporteTokens(resultado.tokens);
        this.mostrarModal('Reporte de Tokens', reporteHTML);
    }

    mostrarReporteErrores() {
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

        const reporteHTML = this.generarReporteErrores(resultado.errores);
        this.mostrarModal('Reporte de Errores', reporteHTML);
    }

    generarReporteTokens(tokens) {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Tokens</title>
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #6366f1; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .token-count { margin-bottom: 20px; padding: 10px; background: #e0e7ff; border-radius: 6px; }
                </style>
            </head>
            <body>
                <h1>Reporte de Tokens</h1>
                <div class="token-count">Total de tokens encontrados: <strong>${tokens.length}</strong></div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Fila</th>
                            <th>Columna</th>
                            <th>Lexema</th>
                            <th>Token</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        tokens.forEach((token, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${token.fila}</td>
                    <td>${token.columna}</td>
                    <td>${token.valor}</td>
                    <td>${token.tipo}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        return html;
    }

    generarReporteErrores(errores) {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Errores</title>
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #ef4444; color: white; }
                    tr:nth-child(even) { background-color: #fef2f2; }
                    .error-count { margin-bottom: 20px; padding: 10px; background: #fee2e2; border-radius: 6px; }
                </style>
            </head>
            <body>
                <h1>Reporte de Errores Léxicos</h1>
                <div class="error-count">Total de errores encontrados: <strong>${errores.length}</strong></div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Fila</th>
                            <th>Columna</th>
                            <th>Carácter</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        errores.forEach((error, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${error.fila}</td>
                    <td>${error.columna}</td>
                    <td>${error.caracter || ''}</td>
                    <td>${error.descripcion}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        return html;
    }

    mostrarModal(titulo, contenidoHTML) {
        this.modalTitle.textContent = titulo;
        this.modalContent.srcdoc = contenidoHTML;
        this.modalOverlay.classList.remove('hidden');
    }

    cerrarModal() {
        this.modalOverlay.classList.add('hidden');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Editor();
});