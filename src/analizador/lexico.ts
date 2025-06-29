interface Token {
    tipo: string;
    valor: string;
    fila: number;
    columna: number;
}

class AnalizadorLexico {
    private codigoFuente: string;
    private posicion: number = 0;
    private fila: number = 1;
    private columna: number = 1;
    private tokens: Token[] = [];
    private errores: any[] = [];

    private palabrasReservadas: {[key: string]: string} = {
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

    private operadores = ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '++', '--'];

    constructor(codigo: string) {
        this.codigoFuente = codigo;
    }

    public analizar(): { tokens: Token[], errores: any[] } {
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
            } else if (caracter === '\'') {
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

    private analizarNumero() {
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

    private analizarIdentificador() {
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

    private analizarCadena() {
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

    private analizarCaracter() {
        let valor = '';
        let inicioColumna = this.columna;
        this.avanzar(); // Saltar la comilla simple inicial

        if (this.posicion < this.codigoFuente.length && this.codigoFuente[this.posicion] !== '\'') {
            valor = this.codigoFuente[this.posicion];
            this.avanzar();
        }

        if (this.posicion < this.codigoFuente.length && this.codigoFuente[this.posicion] === '\'') {
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
                caracter: '\'',
                descripcion: 'Carácter no cerrado correctamente'
            });
        }
    }

    private analizarComentarioLinea() {
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

    private analizarComentarioBloque() {
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

    private analizarOperador() {
        const caracter = this.codigoFuente[this.posicion];
        const siguiente = this.posicion + 1 < this.codigoFuente.length ? this.codigoFuente[this.posicion + 1] : '';
        let operador = caracter;
        let inicioColumna = this.columna;

        // Verificar operadores de dos caracteres (==, !=, <=, >=, ++, --)
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

    private analizarSimbolo(caracter: string) {
        const simbolos: {[key: string]: string} = {
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

    private avanzar() {
        this.posicion++;
        this.columna++;
    }

    private esDigito(caracter: string): boolean {
        return /[0-9]/.test(caracter);
    }

    private esLetra(caracter: string): boolean {
        return /[a-zA-Z]/.test(caracter);
    }

    private esEspacio(caracter: string): boolean {
        return /[ \t]/.test(caracter);
    }

    private esSaltoLinea(caracter: string): boolean {
        return caracter === '\n' || caracter === '\r';
    }

    private esOperador(caracter: string): boolean {
        return ['+', '-', '*', '/', '=', '!', '<', '>'].includes(caracter);
    }

    private esSimbolo(caracter: string): boolean {
        return [';', ',', '.', '{', '}', '(', ')', '[', ']'].includes(caracter);
    }
}

export default AnalizadorLexico;