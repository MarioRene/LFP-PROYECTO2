class GeneradorReportes {
    static generarReporteErrores(errores: any[]): string {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Errores</title>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <h1>Reporte de Errores</h1>
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

    static generarReporteTokens(tokens: any[]): string {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Tokens</title>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <h1>Reporte de Tokens</h1>
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
}

export default GeneradorReportes;
