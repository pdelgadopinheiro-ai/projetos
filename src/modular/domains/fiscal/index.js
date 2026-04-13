const { getNfeConfig } = require('./nfe.config');
const { NFeLogger } = require('./nfe.logger');
const { NFeXmlService } = require('./nfe.xml.service');
const { NFeSignatureService } = require('./nfe.signature.service');
const { NFeSefazService } = require('./nfe.sefaz.service');
const { NFeStorageService } = require('./nfe.storage.service');
const { DanfeService } = require('./nfe.danfe.service');
const { FiscalService } = require('./fiscal.service');
const { FiscalController } = require('./fiscal.controller');
const { createFiscalRouter } = require('./fiscal.routes');

function createFiscalModule({ projectRoot }) {
    const nfeConfig = getNfeConfig(projectRoot);
    const logger = new NFeLogger({ context: 'fiscal-nfe' });
    const xmlService = new NFeXmlService(nfeConfig, logger);
    const signatureService = new NFeSignatureService(nfeConfig, logger);
    const sefazService = new NFeSefazService(nfeConfig, signatureService, xmlService, logger);
    const storageService = new NFeStorageService(nfeConfig, logger);
    const danfeService = new DanfeService(nfeConfig, logger);
    const fiscalService = new FiscalService({
        nfeConfig,
        xmlService,
        signatureService,
        sefazService,
        danfeService,
        storageService,
        logger
    });
    const fiscalController = new FiscalController(fiscalService);
    const router = createFiscalRouter(fiscalController);

    return {
        router,
        service: fiscalService,
        controller: fiscalController,
        config: nfeConfig
    };
}

module.exports = { createFiscalModule };
