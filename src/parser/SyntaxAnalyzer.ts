import { Token, Symbol, SyntaxError, SyntaxResult, TokenType } from '../models';

/**
 * Analizador Sintáctico para C#
 * Implementa análisis descendente recursivo basado en la gramática BNF
 */
export class SyntaxAnalyzer {
    private tokens: Token[];
    private position: number;
    private errors: SyntaxError[];
    private symbols: Symbol[];
    private consoleOutput: string[];
    private translatedCode: string;

    constructor(tokens: Token[]) {
        this.tokens = tokens.filter(token => token.type !== TokenType.COMMENT);
        this.position = 0;
        this.errors = [];
        this.symbols = [];
        this.consoleOutput = [];
        this.translatedCode = '';
    }

    /**
     * Obtiene el token actual
     */
    private getCurrentToken(): Token | null {
        if (this.position >= this.tokens.length) return null;
        return this.tokens[this.position];
    }

    /**
     * Obtiene el siguiente token sin avanzar
     */
    private peekToken(): Token | null {
        if (this.position + 1 >= this.tokens.length) return null;
        return this.tokens[this.position + 1];
    }

    /**
     * Avanza al siguiente token
     */
    private advance(): void {
        this.position++;
    }

    /**
     * Espera un token específico
     */
    private expect(tokenType: string): boolean {
        const token = this.getCurrentToken();
        if (!token || token.type !== tokenType) {
            this.errors.push({
                line: token ? token.line : 'EOF',
                column: token ? token.column : 'EOF',
                message: `Se esperaba ${tokenType}, se encontró ${token ? token.type : 'EOF'}`
            });
            return false;
        }
        this.advance();
        return true;
    }

    /**
     * Punto de entrada principal del análisis
     * <program> ::= <block_using> <class>
     */
    public parseProgram(): SyntaxResult {
        this.translatedCode = '';
        this.symbols = [];
        this.errors = [];
        this.consoleOutput = [];
        
        try {
            this.parseBlockUsing();
            this.parseClass();
            
            return {
                symbols: this.symbols,
                errors: this.errors,
                consoleOutput: this.consoleOutput,
                translatedCode: this.translatedCode,
                success: this.errors.length === 0
            };
        } catch (error) {
            this.errors.push({
                line: 'Unknown',
                column: 'Unknown',
                message: `Error interno: ${error}`
            });
            
            return {
                symbols: this.symbols,
                errors: this.errors,
                consoleOutput: this.consoleOutput,
                translatedCode: this.translatedCode,
                success: false
            };
        }
    }

    /**
     * <block_using> ::= 'using' 'System' ';'
     */
    private parseBlockUsing(): void {
        if (this.getCurrentToken()?.type === TokenType.USING) {
            this.advance(); // using
            this.expect(TokenType.SYSTEM); // System
            this.expect(TokenType.SEMICOLON); // ;
        }
    }

    /**
     * <class> ::= 'public' 'class' ID '{' <block_Main> '}'
     */
    private parseClass(): void {
        this.expect(TokenType.PUBLIC); // public
        this.expect(TokenType.CLASS); // class
        
        const className = this.getCurrentToken();
        if (className?.type === TokenType.IDENTIFIER) {
            this.advance();
        }
        
        this.expect(TokenType.LBRACE); // {
        this.parseBlockMain();
        this.expect(TokenType.RBRACE); // }
    }

    /**
     * <block_Main> ::= 'static' 'void' 'Main' '(' 'string' '[' ']' ID ')' '{' <lista_instrucciones> '}'
     */
    private parseBlockMain(): void {
        this.expect(TokenType.STATIC); // static
        this.expect(TokenType.VOID); // void
        this.expect(TokenType.MAIN); // Main
        this.expect(TokenType.LPAREN); // (
        this.expect(TokenType.STRING_TYPE); // string
        this.expect(TokenType.LBRACKET); // [
        this.expect(TokenType.RBRACKET); // ]
        
        const argsName = this.getCurrentToken();
        if (argsName?.type === TokenType.IDENTIFIER) {
            this.advance();
        }
        
        this.expect(TokenType.RPAREN); // )
        this.expect(TokenType.LBRACE); // {
        this.parseListaInstrucciones();
        this.expect(TokenType.RBRACE); // }
    }

    /**
     * <lista_instrucciones> ::= <instruction> <lista_instruccionesP>
     */
    private parseListaInstrucciones(): void {
        while (this.getCurrentToken() && this.getCurrentToken()!.type !== TokenType.RBRACE) {
            this.parseInstruction();
        }
    }

    /**
     * <instruction> ::= <declaracion> | <asignacion> | <imprimir> | <inst_if> | <inst_for>
     */
    private parseInstruction(): void {
        const token = this.getCurrentToken();
        if (!token) return;

        switch (token.type) {
            case TokenType.INT_TYPE:
            case TokenType.FLOAT_TYPE:
            case TokenType.STRING_TYPE:
            case TokenType.CHAR_TYPE:
            case TokenType.BOOL_TYPE:
                this.parseDeclaracion();
                break;
            case TokenType.IDENTIFIER:
                this.parseAsignacion();
                break;
            case TokenType.CONSOLE:
                this.parseImprimir();
                break;
            case TokenType.IF:
                this.parseInstIf();
                break;
            case TokenType.FOR:
                this.parseInstFor();
                break;
            default:
                this.errors.push({
                    line: token.line,
                    column: token.column,
                    message: `Instrucción no reconocida: ${token.lexeme}`
                });
                this.advance();
        }
    }

    /**
     * <declaracion> ::= <tipo> <listaID> ';'
     */
    private parseDeclaracion(): void {
        const type = this.getCurrentToken()!;
        this.advance(); // tipo
        
        this.parseListaID(type);
        this.expect(TokenType.SEMICOLON);
    }

    /**
     * <listaID> ::= <idAsig> <listaIDP>
     */
    private parseListaID(type: Token): void {
        this.parseIdAsig(type);
        this.parseListaIDP(type);
    }

    /**
     * <idAsig> ::= id '=' <expresion> | id
     */
    private parseIdAsig(type: Token): void {
        const idToken = this.getCurrentToken();
        if (idToken?.type === TokenType.IDENTIFIER) {
            const variableName = idToken.lexeme;
            this.advance();
            
            let value: string | null = null;
            if (this.getCurrentToken()?.type === TokenType.ASSIGN) {
                this.advance(); // =
                value = this.parseExpresion();
            }
            
            // Add to symbols table
            this.symbols.push(new Symbol(
                variableName, 
                value || this.getDefaultValue(type.type), 
                type.lexeme,
                idToken.line, 
                idToken.column
            ));
            
            // Add to translated code
            const tsType = this.csharpToTypeScript(type.lexeme);
            if (value !== null) {
                this.translatedCode += `let ${variableName}: ${tsType} = ${value};\n`;
            } else {
                this.translatedCode += `let ${variableName}: ${tsType};\n`;
            }
        }
    }

    /**
     * <listaIDP> ::= ',' <idAsig> <listaIDP> | ε
     */
    private parseListaIDP(type: Token): void {
        while (this.getCurrentToken()?.type === TokenType.COMMA) {
            this.advance(); // ,
            this.parseIdAsig(type);
        }
    }

    /**
     * <asignacion> ::= id '=' <expresion> ';'
     */
    private parseAsignacion(): void {
        const idToken = this.getCurrentToken();
        if (idToken?.type === TokenType.IDENTIFIER) {
            const variableName = idToken.lexeme;
            this.advance();
            this.expect(TokenType.ASSIGN); // =
            const value = this.parseExpresion();
            this.expect(TokenType.SEMICOLON); // ;
            
            // Update symbol table
            const symbol = this.symbols.find(s => s.name === variableName);
            if (symbol) {
                symbol.value = value;
            }
            
            // Add to translated code
            this.translatedCode += `${variableName} = ${value};\n`;
        }
    }

    /**
     * <imprimir> ::= 'Console' '.' 'WriteLine' '(' <expresion> ')' ';'
     */
    private parseImprimir(): void {
        this.expect(TokenType.CONSOLE); // Console
        this.expect(TokenType.DOT); // .
        this.expect(TokenType.WRITELINE); // WriteLine
        this.expect(TokenType.LPAREN); // (
        const expression = this.parseExpresion();
        this.expect(TokenType.RPAREN); // )
        this.expect(TokenType.SEMICOLON); // ;
        
        // Evaluate expression for console output
        const output = this.evaluateExpression(expression);
        this.consoleOutput.push(output);
        
        // Add to translated code
        this.translatedCode += `console.log(${expression});\n`;
    }

    /**
     * <inst_if> ::= 'if' '(' <expresion> ')' '{' <lista_instrucciones> '}' <inst_ifP>
     */
    private parseInstIf(): void {
        this.expect(TokenType.IF); // if
        this.expect(TokenType.LPAREN); // (
        const condition = this.parseExpresion();
        this.expect(TokenType.RPAREN); // )
        this.expect(TokenType.LBRACE); // {
        
        this.translatedCode += `if (${condition}) {\n`;
        this.parseListaInstrucciones();
        this.expect(TokenType.RBRACE); // }
        this.translatedCode += `}\n`;
        
        this.parseInstIfP();
    }

    /**
     * <inst_ifP> ::= 'else' '{' <lista_instrucciones> '}' | ε
     */
    private parseInstIfP(): void {
        if (this.getCurrentToken()?.type === TokenType.ELSE) {
            this.advance(); // else
            this.expect(TokenType.LBRACE); // {
            this.translatedCode += ` else {\n`;
            this.parseListaInstrucciones();
            this.expect(TokenType.RBRACE); // }
            this.translatedCode += `}\n`;
        }
    }

    /**
     * <inst_for> ::= 'for' '(' <primer_bloque_for> ';' <expresion> ';' <tercer_bloque_for> ')' '{' <lista_instrucciones> '}'
     */
    private parseInstFor(): void {
        this.expect(TokenType.FOR); // for
        this.expect(TokenType.LPAREN); // (
        
        this.translatedCode += `for (`;
        this.parsePrimerBloqueFor();
        this.expect(TokenType.SEMICOLON); // ;
        this.translatedCode += `; `;
        
        const condition = this.parseExpresion();
        this.translatedCode += `${condition}`;
        this.expect(TokenType.SEMICOLON); // ;
        this.translatedCode += `; `;
        
        const update = this.parseTercerBloqueFor();
        this.translatedCode += `${update}`;
        this.expect(TokenType.RPAREN); // )
        this.expect(TokenType.LBRACE); // {
        this.translatedCode += `) {\n`;
        
        this.parseListaInstrucciones();
        this.expect(TokenType.RBRACE); // }
        this.translatedCode += `}\n`;
    }

    /**
     * <primer_bloque_for> ::= <declaracion> | <asignacion>
     */
    private parsePrimerBloqueFor(): void {
        const token = this.getCurrentToken();
        if ([TokenType.INT_TYPE, TokenType.FLOAT_TYPE, TokenType.STRING_TYPE, TokenType.CHAR_TYPE, TokenType.BOOL_TYPE].includes(token?.type as TokenType)) {
            const type = this.getCurrentToken()!;
            this.advance();
            const idToken = this.getCurrentToken();
            if (idToken?.type === TokenType.IDENTIFIER) {
                const variableName = idToken.lexeme;
                this.advance();
                if (this.getCurrentToken()?.type === TokenType.ASSIGN) {
                    this.advance();
                    const value = this.parseExpresion();
                    const tsType = this.csharpToTypeScript(type.lexeme);
                    this.translatedCode += `let ${variableName}: ${tsType} = ${value}`;
                    this.symbols.push(new Symbol(variableName, value, type.lexeme, idToken.line, idToken.column));
                }
            }
        } else if (token?.type === TokenType.IDENTIFIER) {
            const variableName = token.lexeme;
            this.advance();
            this.expect(TokenType.ASSIGN);
            const value = this.parseExpresion();
            this.translatedCode += `${variableName} = ${value}`;
            const symbol = this.symbols.find(s => s.name === variableName);
            if (symbol) symbol.value = value;
        }
    }

    /**
     * <tercer_bloque_for> ::= id <tercer_bloque_for_P>
     */
    private parseTercerBloqueFor(): string {
        const idToken = this.getCurrentToken();
        if (idToken?.type === TokenType.IDENTIFIER) {
            const variableName = idToken.lexeme;
            this.advance();
            const operator = this.parseTercerBloqueForP();
            return `${variableName}${operator}`;
        }
        return '';
    }

    /**
     * <tercer_bloque_for_P> ::= <incremento> | <decremento>
     */
    private parseTercerBloqueForP(): string {
        const token = this.getCurrentToken();
        if (token?.type === TokenType.INCREMENT) {
            this.advance();
            return '++';
        } else if (token?.type === TokenType.DECREMENT) {
            this.advance();
            return '--';
        }
        return '';
    }

    /**
     * <expresion> ::= <aritmetica> <relacional>
     */
    private parseExpresion(): string {
        let left = this.parseAritmetica();
        
        const relationalOp = this.parseRelacional();
        if (relationalOp) {
            const right = this.parseAritmetica();
            return `${left} ${relationalOp} ${right}`;
        }
        
        return left;
    }

    /**
     * <relacional> ::= '==' <aritmetica> | '!=' <aritmetica> | '<=' <aritmetica> | '>=' <aritmetica> | '<' <aritmetica> | '>' <aritmetica> | ε
     */
    private parseRelacional(): string | null {
        const token = this.getCurrentToken();
        if ([TokenType.EQUALS, TokenType.NOT_EQUALS, TokenType.LTE, TokenType.GTE, TokenType.LT, TokenType.GT].includes(token?.type as TokenType)) {
            const operators: { [key: string]: string } = {
                [TokenType.EQUALS]: '==',
                [TokenType.NOT_EQUALS]: '!=',
                [TokenType.LTE]: '<=',
                [TokenType.GTE]: '>=',
                [TokenType.LT]: '<',
                [TokenType.GT]: '>'
            };
            this.advance();
            return operators[token!.type];
        }
        return null;
    }

    /**
     * <aritmetica> ::= <termino> <aritmeticaP>
     */
    private parseAritmetica(): string {
        let result = this.parseTermino();
        return this.parseAritmeticaP(result);
    }

    /**
     * <aritmeticaP> ::= '+' <termino> <aritmeticaP> | '-' <termino> <aritmeticaP> | ε
     */
    private parseAritmeticaP(left: string): string {
        while (this.getCurrentToken()?.type === TokenType.PLUS || this.getCurrentToken()?.type === TokenType.MINUS) {
            const operator = this.getCurrentToken()!.lexeme;
            this.advance();
            const right = this.parseTermino();
            left = `${left} ${operator} ${right}`;
        }
        return left;
    }

    /**
     * <termino> ::= <factor> <terminoP>
     */
    private parseTermino(): string {
        let result = this.parseFactor();
        return this.parseTerminoP(result);
    }

    /**
     * <terminoP> ::= '*' <factor> <terminoP> | '/' <factor> <terminoP> | ε
     */
    private parseTerminoP(left: string): string {
        while (this.getCurrentToken()?.type === TokenType.MULTIPLY || this.getCurrentToken()?.type === TokenType.DIVIDE) {
            const operator = this.getCurrentToken()!.lexeme;
            this.advance();
            const right = this.parseFactor();
            left = `${left} ${operator} ${right}`;
        }
        return left;
    }

    /**
     * <factor> ::= '(' <aritmetica> ')' | id | num | decimal | char | string | false | true
     */
    private parseFactor(): string {
        const token = this.getCurrentToken();
        
        if (token?.type === TokenType.LPAREN) {
            this.advance(); // (
            const expr = this.parseAritmetica();
            this.expect(TokenType.RPAREN); // )
            return `(${expr})`;
        } else if (token?.type === TokenType.IDENTIFIER) {
            this.advance();
            return token.lexeme;
        } else if (token?.type === TokenType.INTEGER) {
            this.advance();
            return token.lexeme;
        } else if (token?.type === TokenType.FLOAT) {
            this.advance();
            return token.lexeme.replace('f', ''); // Remove 'f' suffix for TypeScript
        } else if (token?.type === TokenType.CHAR) {
            this.advance();
            return `"${token.lexeme.slice(1, -1)}"`; // Convert char to string
        } else if (token?.type === TokenType.STRING) {
            this.advance();
            return token.lexeme;
        } else if (token?.type === TokenType.TRUE) {
            this.advance();
            return 'true';
        } else if (token?.type === TokenType.FALSE) {
            this.advance();
            return 'false';
        }
        
        this.errors.push({
            line: token?.line || 'EOF',
            column: token?.column || 'EOF',
            message: `Factor no válido: ${token?.lexeme || 'EOF'}`
        });
        
        return '';
    }

    /**
     * Obtiene el valor por defecto para un tipo
     */
    private getDefaultValue(type: string): string {
        const defaults: { [key: string]: string } = {
            [TokenType.INT_TYPE]: '0',
            [TokenType.FLOAT_TYPE]: '0.0',
            [TokenType.STRING_TYPE]: '""',
            [TokenType.CHAR_TYPE]: "''",
            [TokenType.BOOL_TYPE]: 'false'
        };
        return defaults[type] || '0';
    }

    /**
     * Convierte tipos de C# a TypeScript
     */
    private csharpToTypeScript(type: string): string {
        const typeMap: { [key: string]: string } = {
            'int': 'number',
            'float': 'number',
            'string': 'string',
            'char': 'string',
            'bool': 'boolean'
        };
        return typeMap[type] || 'any';
    }

    /**
     * Evalúa una expresión para la salida de consola
     */
    private evaluateExpression(expr: string): string {
        try {
            let evaluatedExpr = expr;
            for (const symbol of this.symbols) {
                const regex = new RegExp(`\\b${symbol.name}\\b`, 'g');
                let value = symbol.value;
                if (symbol.type === 'string') {
                    value = value.replace(/"/g, '');
                }
                evaluatedExpr = evaluatedExpr.replace(regex, value);
            }
            
            evaluatedExpr = evaluatedExpr.replace(/\+/g, ' + ');
            return evaluatedExpr;
        } catch (e) {
            return expr;
        }
    }
}
