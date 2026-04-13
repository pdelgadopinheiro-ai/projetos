/* eslint-disable no-console */
const { emitirNotaFiscal } = require('../src/modular/domains/fiscal/emitir-nota-fiscal');

async function main() {
    const dadosVenda = {
        saleId: 'VENDA-123',
        invoiceNumber: 123,
        serie: 1,
        issueDate: new Date().toISOString(),
        paymentMethod: 'pix',
        customer: {
            name: 'Cliente Teste',
            document: '12345678909',
            email: 'cliente@teste.com.br',
            city: 'Campo Grande',
            uf: 'MS',
            address: {
                street: 'Rua das Flores',
                number: '100',
                neighborhood: 'Centro',
                city: 'Campo Grande',
                cityCode: '5002704',
                uf: 'MS',
                cep: '79000000'
            }
        },
        items: [
            {
                code: 'PROD-001',
                description: 'Produto de teste',
                ncm: '22030000',
                cfop: '5102',
                unit: 'UN',
                quantity: 2,
                unitPrice: 19.9,
                barcode: '7894900011517',
                taxes: {
                    icmsRate: 18,
                    pisRate: 1.65,
                    cofinsRate: 7.6
                }
            }
        ],
        additionalInfo: 'Documento emitido por integracao ERP.'
    };

    const result = await emitirNotaFiscal(dadosVenda);
    console.log('Resultado emissao NF-e:');
    console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error('Falha na emissao de NF-e:', error);
    process.exit(1);
});
