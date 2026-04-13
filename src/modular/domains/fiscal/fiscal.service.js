const { ValidationError } = require('../../shared/errors');

class FiscalService {
    constructor({
        nfeConfig,
        xmlService,
        signatureService,
        sefazService,
        danfeService,
        storageService,
        logger
    }) {
        this.nfeConfig = nfeConfig;
        this.xmlService = xmlService;
        this.signatureService = signatureService;
        this.sefazService = sefazService;
        this.danfeService = danfeService;
        this.storageService = storageService;
        this.logger = logger;
    }

    async emitirNotaFiscal(dadosVenda) {
        if (!dadosVenda || typeof dadosVenda !== 'object') {
            throw new ValidationError('dadosVenda obrigatorio para emitir NF-e.');
        }

        this.logger.info('emitirNotaFiscal', 'Inicio da emissao de NF-e.', {
            ambiente: this.nfeConfig.environment,
            vendaId: dadosVenda.saleId || dadosVenda.id || null
        });

        const unsigned = this.xmlService.buildUnsignedNFeXml(dadosVenda);
        const signedXml = this.signatureService.signNFeXml(unsigned.xml);
        const loteXml = this.xmlService.buildEnviNFeXml({
            signedNFeXml: signedXml,
            loteId: dadosVenda.batchId,
            indSinc: dadosVenda.indSinc ? String(dadosVenda.indSinc) : '1'
        });

        const unsignedPath = await this.storageService.storeXml({
            xml: unsigned.xml,
            accessKey: unsigned.accessKey,
            type: 'unsigned'
        });
        const signedPath = await this.storageService.storeXml({
            xml: signedXml,
            accessKey: unsigned.accessKey,
            type: 'signed'
        });

        const sefazResult = await this.sefazService.enviarLoteAutorizacao({
            enviNFeXml: loteXml,
            syncMode: dadosVenda.indSinc ? String(dadosVenda.indSinc) : '1'
        });

        await this.storageService.storeXml({
            xml: sefazResult.rawResponseXml || '',
            accessKey: unsigned.accessKey,
            type: 'sefaz-response',
            statusCode: sefazResult.statusCode
        });

        let authorizedXmlPath = null;
        let danfePath = null;

        if (sefazResult.authorized && sefazResult.protocolXml) {
            const nfeProcXml = this.xmlService.buildNFeProcXml({
                signedNFeXml: signedXml,
                protNFeXml: sefazResult.protocolXml
            });
            authorizedXmlPath = await this.storageService.storeXml({
                xml: nfeProcXml,
                accessKey: unsigned.accessKey,
                type: 'authorized',
                statusCode: sefazResult.statusCode
            });

            danfePath = await this.danfeService.generateDanfePdf({
                accessKey: unsigned.accessKey,
                protocolNumber: sefazResult.protocolNumber,
                protocolDate: sefazResult.protocolDate,
                issueDate: unsigned.issueDate,
                emitter: {
                    xNome: this.nfeConfig.emitter.xNome,
                    cnpj: this.nfeConfig.emitter.cnpj,
                    ie: this.nfeConfig.emitter.ie
                },
                recipient: {
                    name: dadosVenda?.customer?.name || dadosVenda?.customer?.nome || 'CONSUMIDOR FINAL',
                    document: dadosVenda?.customer?.document || dadosVenda?.customer?.cpfCnpj || '-',
                    city: dadosVenda?.customer?.city || dadosVenda?.customer?.address?.city || '-',
                    uf: dadosVenda?.customer?.uf || dadosVenda?.customer?.address?.uf || this.nfeConfig.emitter.uf
                },
                items: unsigned.totals ? this.xmlService.normalizeSaleData(dadosVenda).items : [],
                totals: unsigned.totals
            });
        }

        const responsePayload = {
            status: sefazResult.authorized ? 'AUTORIZADA' : 'REJEITADA',
            environment: this.nfeConfig.environment,
            accessKey: unsigned.accessKey,
            invoiceNumber: unsigned.invoiceNumber,
            serie: unsigned.serie,
            cStat: sefazResult.statusCode,
            xMotivo: sefazResult.message,
            nProt: sefazResult.protocolNumber || null,
            dhRecbto: sefazResult.protocolDate || null,
            nRec: sefazResult.receiptNumber || null,
            xmlPaths: {
                unsigned: unsignedPath,
                signed: signedPath,
                authorized: authorizedXmlPath
            },
            danfePath
        };

        await this.storageService.storeJson({
            payload: responsePayload,
            accessKey: unsigned.accessKey,
            type: 'result'
        });

        this.logger.info('emitirNotaFiscal', 'Processo de emissao finalizado.', {
            accessKey: unsigned.accessKey,
            status: responsePayload.status,
            cStat: responsePayload.cStat
        });

        return responsePayload;
    }
}

module.exports = { FiscalService };
