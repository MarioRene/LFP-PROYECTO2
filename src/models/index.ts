/**
 * Representa un token encontrado durante el análisis léxico
 */
export class Token {
    constructor(
        public type: string,
        public lexeme: string,
        public line: number,
        public column: number
    ) {}
}

/**
 * Representa un error léxico encontrado durante el análisis
 */
export class LexicalError {
    constructor(
        public character: string,
        public line: number,
        public column: number,
        public description: string
    ) {}
}

/**
 * Representa un símbolo en la tabla de símbolos
 */
export class Symbol {
    constructor(
        public name: string,
        public value: string,
        public type: string,
        public line: number,
        public column: number
    ) {}
}

/**
 * Representa un error sintáctico
 */
export interface SyntaxError {
    line: number | string;
    column: number | string;
    message: string;
}

/**
 * Resultado del análisis léxico
 */
export interface LexicalResult {
    tokens: Token[];
    errors: LexicalError[];
}

/**
 * Resultado del análisis sintáctico
 */
export interface SyntaxResult {
    symbols: Symbol[];
    errors: SyntaxError[];
    consoleOutput: string[];
    translatedCode: string;
    success: boolean;
}

/**
 * Tipos de tokens válidos
 */
export enum TokenType {
    // Palabras reservadas
    USING = 'USING',
    SYSTEM = 'SYSTEM',
    PUBLIC = 'PUBLIC',
    CLASS = 'CLASS',
    STATIC = 'STATIC',
    VOID = 'VOID',
    MAIN = 'MAIN',
    
    // Tipos de datos
    STRING_TYPE = 'STRING_TYPE',
    INT_TYPE = 'INT_TYPE',
    FLOAT_TYPE = 'FLOAT_TYPE',
    CHAR_TYPE = 'CHAR_TYPE',
    BOOL_TYPE = 'BOOL_TYPE',
    
    // Estructuras de control
    IF = 'IF',
    ELSE = 'ELSE',
    FOR = 'FOR',
    
    // Console
    CONSOLE = 'CONSOLE',
    WRITELINE = 'WRITELINE',
    
    // Literales
    TRUE = 'TRUE',
    FALSE = 'FALSE',
    INTEGER = 'INTEGER',
    FLOAT = 'FLOAT',
    STRING = 'STRING',
    CHAR = 'CHAR',
    IDENTIFIER = 'IDENTIFIER',
    
    // Operadores
    ASSIGN = 'ASSIGN',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    MULTIPLY = 'MULTIPLY',
    DIVIDE = 'DIVIDE',
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    LT = 'LT',
    GT = 'GT',
    LTE = 'LTE',
    GTE = 'GTE',
    INCREMENT = 'INCREMENT',
    DECREMENT = 'DECREMENT',
    
    // Delimitadores
    SEMICOLON = 'SEMICOLON',
    COMMA = 'COMMA',
    DOT = 'DOT',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    LBRACE = 'LBRACE',
    RBRACE = 'RBRACE',
    LBRACKET = 'LBRACKET',
    RBRACKET = 'RBRACKET',
    
    // Comentarios
    COMMENT = 'COMMENT'
}
