import { Token, LexicalError, LexicalResult, TokenType } from '../models';

/**
 * Analizador Léxico para C#
 * Implementa un autómata finito determinista para reconocer tokens
 */
export class LexicalAnalyzer {
    private input: string;
    private position: number;
    private line: number;
    private column: number;
    private tokens: Token[];
    private errors: LexicalError[];
    private keywords: Map<string, string> = new Map([
        ['using', TokenType.USING],
        ['System', TokenType.SYSTEM],
        ['public', TokenType.PUBLIC],
        ['class', TokenType.CLASS],
        ['static', TokenType.STATIC],
        ['void', TokenType.VOID],
        ['Main', TokenType.MAIN],
        ['string', TokenType.STRING_TYPE],
        ['int', TokenType.INT_TYPE],
        ['float', TokenType.FLOAT_TYPE],
        ['char', TokenType.CHAR_TYPE],
        ['bool', TokenType.BOOL_TYPE],
        ['if', TokenType.IF],
        ['else', TokenType.ELSE],
        ['for', TokenType.FOR],
        ['Console', TokenType.CONSOLE],
        ['WriteLine', TokenType.WRITELINE],
        ['true', TokenType.TRUE],
        ['false', TokenType.FALSE]
    ]);

    constructor(input: string) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.errors = [];
    }

    /**
     * Obtiene el carácter actual
     */
    private getCurrentChar(): string | null {
        if (this.position >= this.input.length) return null;
        return this.input[this.position];
    }

    /**
     * Obtiene el siguiente carácter sin avanzar la posición
     */
    private peekChar(): string | null {
        if (this.position + 1 >= this.input.length) return null;
        return this.input[this.position + 1];
    }

    /**
     * Avanza la posición y actualiza línea/columna
     */
    private advance(): void {
        if (this.position < this.input.length) {
            if (this.input[this.position] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.position++;
        }
    }

    /**
     * Omite espacios en blanco
     */
    private skipWhitespace(): void {
        while (this.getCurrentChar() && /\s/.test(this.getCurrentChar()!)) {
            this.advance();
        }
    }

    /**
     * Escanea una cadena de texto
     */
    private scanString(): Token | null {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        
        this.advance(); // Skip opening quote
        
        while (this.getCurrentChar() && this.getCurrentChar() !== '"') {
            value += this.getCurrentChar();
            this.advance();
        }
        
        if (this.getCurrentChar() === '"') {
            this.advance(); // Skip closing quote
            return new Token(TokenType.STRING, `"${value}"`, startLine, startColumn);
        } else {
            this.errors.push(new LexicalError('"', startLine, startColumn, 'String no terminada'));
            return null;
        }
    }

    /**
     * Escanea un carácter
     */
    private scanChar(): Token | null {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        
        this.advance(); // Skip opening quote
        
        if (this.getCurrentChar() && this.getCurrentChar() !== "'") {
            value = this.getCurrentChar()!;
            this.advance();
            
            if (this.getCurrentChar() === "'") {
                this.advance(); // Skip closing quote
                return new Token(TokenType.CHAR, `'${value}'`, startLine, startColumn);
            }
        }
        
        this.errors.push(new LexicalError("'", startLine, startColumn, 'Carácter no válido'));
        return null;
    }

    /**
     * Escanea un número (entero o decimal)
     */
    private scanNumber(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        let isFloat = false;
        
        while (this.getCurrentChar() && /\d/.test(this.getCurrentChar()!)) {
            value += this.getCurrentChar();
            this.advance();
        }
        
        if (this.getCurrentChar() === '.') {
            isFloat = true;
            value += this.getCurrentChar();
            this.advance();
            
            while (this.getCurrentChar() && /\d/.test(this.getCurrentChar()!)) {
                value += this.getCurrentChar();
                this.advance();
            }
        }
        
        // Check for 'f' suffix on floats
        if (this.getCurrentChar() === 'f' && isFloat) {
            value += this.getCurrentChar();
            this.advance();
        }
        
        return new Token(isFloat ? TokenType.FLOAT : TokenType.INTEGER, value, startLine, startColumn);
    }

    /**
     * Escanea un identificador o palabra reservada
     */
    private scanIdentifier(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        
        while (this.getCurrentChar() && /[a-zA-Z0-9_]/.test(this.getCurrentChar()!)) {
            value += this.getCurrentChar();
            this.advance();
        }
        
        const tokenType = this.keywords.get(value) || TokenType.IDENTIFIER;
        return new Token(tokenType, value, startLine, startColumn);
    }

    /**
     * Escanea comentarios
     */
    private scanComment(): Token | null {
        const startLine = this.line;
        const startColumn = this.column;
        
        if (this.getCurrentChar() === '/' && this.peekChar() === '/') {
            // Single line comment
            let value = '';
            while (this.getCurrentChar() && this.getCurrentChar() !== '\n') {
                value += this.getCurrentChar();
                this.advance();
            }
            return new Token(TokenType.COMMENT, value, startLine, startColumn);
        } else if (this.getCurrentChar() === '/' && this.peekChar() === '*') {
            // Multi-line comment
            let value = '';
            this.advance(); // Skip '/'
            this.advance(); // Skip '*'
            value = '/*';
            
            while (this.getCurrentChar()) {
                if (this.getCurrentChar() === '*' && this.peekChar() === '/') {
                    value += this.getCurrentChar();
                    this.advance();
                    value += this.getCurrentChar();
                    this.advance();
                    break;
                }
                value += this.getCurrentChar();
                this.advance();
            }
            
            return new Token(TokenType.COMMENT, value, startLine, startColumn);
        }
        
        return null;
    }

    /**
     * Obtiene el tipo de operador de dos caracteres
     */
    private getOperatorType(operator: string): string {
        const types: { [key: string]: string } = {
            '==': TokenType.EQUALS,
            '!=': TokenType.NOT_EQUALS,
            '<=': TokenType.LTE,
            '>=': TokenType.GTE,
            '++': TokenType.INCREMENT,
            '--': TokenType.DECREMENT
        };
        return types[operator] || 'UNKNOWN';
    }

    /**
     * Realiza el análisis léxico completo
     */
    public analyze(): LexicalResult {
        while (this.position < this.input.length) {
            this.skipWhitespace();
            
            if (this.position >= this.input.length) break;
            
            const currentChar = this.getCurrentChar()!;
            const startLine = this.line;
            const startColumn = this.column;
            
            // Comments
            if (currentChar === '/' && (this.peekChar() === '/' || this.peekChar() === '*')) {
                const comment = this.scanComment();
                if (comment) this.tokens.push(comment);
                continue;
            }
            
            // Strings
            if (currentChar === '"') {
                const string = this.scanString();
                if (string) this.tokens.push(string);
                continue;
            }
            
            // Characters
            if (currentChar === "'") {
                const char = this.scanChar();
                if (char) this.tokens.push(char);
                continue;
            }
            
            // Numbers
            if (/\d/.test(currentChar)) {
                this.tokens.push(this.scanNumber());
                continue;
            }
            
            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(currentChar)) {
                this.tokens.push(this.scanIdentifier());
                continue;
            }
            
            // Two-character operators
            const twoChar = currentChar + (this.peekChar() || '');
            if (['==', '!=', '<=', '>=', '++', '--'].includes(twoChar)) {
                this.tokens.push(new Token(this.getOperatorType(twoChar), twoChar, startLine, startColumn));
                this.advance();
                this.advance();
                continue;
            }
            
            // Single-character tokens
            const singleCharTokens: { [key: string]: string } = {
                ';': TokenType.SEMICOLON,
                ',': TokenType.COMMA,
                '.': TokenType.DOT,
                '(': TokenType.LPAREN,
                ')': TokenType.RPAREN,
                '{': TokenType.LBRACE,
                '}': TokenType.RBRACE,
                '[': TokenType.LBRACKET,
                ']': TokenType.RBRACKET,
                '=': TokenType.ASSIGN,
                '+': TokenType.PLUS,
                '-': TokenType.MINUS,
                '*': TokenType.MULTIPLY,
                '/': TokenType.DIVIDE,
                '<': TokenType.LT,
                '>': TokenType.GT
            };
            
            if (singleCharTokens[currentChar]) {
                this.tokens.push(new Token(singleCharTokens[currentChar], currentChar, startLine, startColumn));
                this.advance();
                continue;
            }
            
            // Unknown character - error
            this.errors.push(new LexicalError(currentChar, startLine, startColumn, 'Carácter desconocido'));
            this.advance();
        }
        
        return { tokens: this.tokens, errors: this.errors };
    }
}
