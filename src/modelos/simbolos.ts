interface Simbolo {
    nombre: string;
    tipo: 'number' | 'string' | 'boolean' | 'any';
    valor: any;
    ambito: string;
}

class TablaSimbolos {
    private simbolos: Simbolo[];
    private ambitoActual: string;

    constructor() {
        this.simbolos = [];
        this.ambitoActual = 'global';
    }

    public agregar(nombre: string, tipo: 'number' | 'string' | 'boolean' | 'any', valor?: any): void {
        // Verificar si el símbolo ya existe
        const existe = this.simbolos.some(s => s.nombre === nombre && s.ambito === this.ambitoActual);
        
        if (!existe) {
            this.simbolos.push({
                nombre,
                tipo,
                valor: valor !== undefined ? valor : this.getValorPorDefecto(tipo),
                ambito: this.ambitoActual
            });
        }
    }

    public actualizar(nombre: string, valor: any): boolean {
        const simbolo = this.simbolos.find(s => s.nombre === nombre && s.ambito === this.ambitoActual);
        
        if (simbolo) {
            simbolo.valor = valor;
            return true;
        }
        
        return false;
    }

    public buscar(nombre: string): Simbolo | undefined {
        return this.simbolos.find(s => s.nombre === nombre && s.ambito === this.ambitoActual);
    }

    public entrarAmbito(ambito: string): void {
        this.ambitoActual = ambito;
    }

    public salirAmbito(): void {
        this.ambitoActual = 'global';
    }

    public obtenerSimbolos(): Simbolo[] {
        return [...this.simbolos];
    }

    private getValorPorDefecto(tipo: string): any {
        switch (tipo) {
            case 'number': return 0;
            case 'string': return '';
            case 'boolean': return false;
            default: return null;
        }
    }
}

export default TablaSimbolos;
