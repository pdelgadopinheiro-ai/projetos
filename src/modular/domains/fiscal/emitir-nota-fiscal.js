const path = require('path');
const { createFiscalModule } = require('./index');

async function emitirNotaFiscal(dadosVenda) {
    const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
    const fiscalModule = createFiscalModule({ projectRoot });
    return fiscalModule.service.emitirNotaFiscal(dadosVenda);
}

module.exports = { emitirNotaFiscal };
