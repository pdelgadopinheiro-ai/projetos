const https = require('https');
const axios = require('axios');
const { XMLBuilder, XMLParser } = require('fast-xml-parser');
const { ValidationError } = require('../../shared/errors');

class NFeSefazService {
    constructor(nfeConfig, signatureService, xmlService, logger) {
        this.nfeConfig = nfeConfig;
        this.signatureService = signatureService;
        this.xmlService = xmlService;
        this.logger = logger;
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseTagValue: true,
            trimValues: true
        });
        this.xmlBuilder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            format: false
        });
    }

    async enviarLoteAutorizacao({ enviNFeXml, syncMode = '1' }) {
        const environmentKey = this.nfeConfig.environment === 'producao' ? 'producao' : 'homologacao';
        const endpoints = this.nfeConfig.endpoints[environmentKey];
        if (!endpoints?.autorizacao || !endpoints?.retAutorizacao) {
            throw new ValidationError('Endpoints SEFAZ nao configurados.');
        }

        const authResponse = await this.callSoapService({
            endpoint: endpoints.autorizacao,
            serviceName: 'NFeAutorizacao4',
            operation: 'nfeAutorizacaoLote',
            payloadXml: enviNFeXml
        });

        const retEnviXml = this.extractXmlNode(authResponse.rawXml, 'retEnviNFe');
        if (!retEnviXml) {
            throw new ValidationError('Resposta da SEFAZ sem retEnviNFe.');
        }
        const retEnvi = this.parseNodeByName(retEnviXml, 'retEnviNFe');
        const cStat = String(retEnvi?.cStat || '');
        const xMotivo = String(retEnvi?.xMotivo || 'Sem motivo informado');

        this.logger.info('enviarSEFAZ', 'Retorno recebido da autorizacao.', { cStat, xMotivo });

        if (cStat === '100' || cStat === '150') {
            const protocolXml = this.extractXmlNode(authResponse.rawXml, 'protNFe')
                || this.buildNodeXml('protNFe', retEnvi?.protNFe);
            return this.buildAuthorizedResult({
                statusCode: cStat,
                message: xMotivo,
                protocolXml,
                rawRequestXml: authResponse.requestXml,
                rawResponseXml: authResponse.rawXml,
                receiptNumber: retEnvi?.infRec?.nRec || null,
                retNode: retEnvi
            });
        }

        if (cStat === '104') {
            const protocolInfo = this.extractProtocolInfoFromNode(retEnvi?.protNFe);
            const protocolXml = this.extractXmlNode(authResponse.rawXml, 'protNFe')
                || this.buildNodeXml('protNFe', retEnvi?.protNFe);
            const isAuthorized = protocolInfo.cStat === '100' || protocolInfo.cStat === '150';
            return {
                authorized: isAuthorized,
                statusCode: protocolInfo.cStat || cStat,
                message: protocolInfo.xMotivo || xMotivo,
                protocolNumber: protocolInfo.nProt || null,
                protocolDate: protocolInfo.dhRecbto || null,
                protocolXml,
                receiptNumber: retEnvi?.infRec?.nRec || null,
                rawRequestXml: authResponse.requestXml,
                rawResponseXml: authResponse.rawXml
            };
        }

        if (cStat !== '103' || syncMode === '1') {
            return {
                authorized: false,
                statusCode: cStat,
                message: xMotivo,
                protocolNumber: null,
                protocolDate: null,
                protocolXml: null,
                receiptNumber: retEnvi?.infRec?.nRec || null,
                rawRequestXml: authResponse.requestXml,
                rawResponseXml: authResponse.rawXml
            };
        }

        const receiptNumber = String(retEnvi?.infRec?.nRec || '');
        if (!receiptNumber) {
            throw new ValidationError('SEFAZ retornou processamento em lote, mas sem numero de recibo (nRec).');
        }

        this.logger.info('enviarSEFAZ', 'Lote recebido, iniciando consulta de recibo.', { receiptNumber });
        let lastRetorno = null;

        for (let attempt = 1; attempt <= this.nfeConfig.pollAttempts; attempt += 1) {
            const consReciXml = this.xmlService.buildConsReciNFeXml(receiptNumber);
            const retResponse = await this.callSoapService({
                endpoint: endpoints.retAutorizacao,
                serviceName: 'NFeRetAutorizacao4',
                operation: 'nfeRetAutorizacaoLote',
                payloadXml: consReciXml
            });

            const retConsXml = this.extractXmlNode(retResponse.rawXml, 'retConsReciNFe');
            if (!retConsXml) {
                throw new ValidationError('Resposta da consulta de recibo sem retConsReciNFe.');
            }

            const retCons = this.parseNodeByName(retConsXml, 'retConsReciNFe');
            const status = String(retCons?.cStat || '');
            const message = String(retCons?.xMotivo || 'Sem motivo informado');
            lastRetorno = {
                requestXml: retResponse.requestXml,
                responseXml: retResponse.rawXml,
                node: retCons
            };

            this.logger.info('consultarRecibo', `Tentativa ${attempt}/${this.nfeConfig.pollAttempts}.`, {
                receiptNumber,
                status,
                message
            });

            if (status === '105') {
                await this.sleep(this.nfeConfig.pollIntervalMs);
                continue;
            }

            const protocolXml = this.extractXmlNode(retResponse.rawXml, 'protNFe')
                || this.buildNodeXml('protNFe', retCons?.protNFe);
            const protocolInfo = this.extractProtocolInfoFromNode(retCons?.protNFe);
            const authorized = protocolInfo.cStat === '100' || protocolInfo.cStat === '150';
            return {
                authorized,
                statusCode: protocolInfo.cStat || status,
                message: protocolInfo.xMotivo || message,
                protocolNumber: protocolInfo.nProt || null,
                protocolDate: protocolInfo.dhRecbto || null,
                protocolXml,
                receiptNumber,
                rawRequestXml: retResponse.requestXml,
                rawResponseXml: retResponse.rawXml
            };
        }

        return {
            authorized: false,
            statusCode: String(lastRetorno?.node?.cStat || '105'),
            message: String(lastRetorno?.node?.xMotivo || 'Lote em processamento apos tempo limite de consulta.'),
            protocolNumber: null,
            protocolDate: null,
            protocolXml: null,
            receiptNumber,
            rawRequestXml: lastRetorno?.requestXml || '',
            rawResponseXml: lastRetorno?.responseXml || ''
        };
    }

    async callSoapService({ endpoint, serviceName, operation, payloadXml }) {
        const { pfx, passphrase } = this.signatureService.getTlsCredentials();
        const httpsAgent = new https.Agent({
            pfx,
            passphrase,
            keepAlive: true,
            rejectUnauthorized: this.nfeConfig.tlsRejectUnauthorized,
            minVersion: 'TLSv1.2'
        });

        const soapXml = this.buildSoapEnvelope({
            serviceName,
            operation,
            payloadXml
        });

        const contentType = `application/soap+xml; charset=utf-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/${serviceName}/${operation}"`;
        const response = await axios.post(endpoint, soapXml, {
            httpsAgent,
            timeout: this.nfeConfig.soapTimeoutMs,
            responseType: 'text',
            headers: {
                'Content-Type': contentType
            }
        });

        return {
            requestXml: soapXml,
            rawXml: String(response.data || '')
        };
    }

    buildSoapEnvelope({ serviceName, payloadXml }) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/${serviceName}">
      <cUF>${this.nfeConfig.emitter.cUF}</cUF>
      <versaoDados>${this.nfeConfig.nfeVersion}</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/${serviceName}">
      ${payloadXml}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
    }

    extractXmlNode(xmlText, localName) {
        if (!xmlText) {
            return null;
        }

        const withPrefixPattern = new RegExp(`<([\\w-]+:)?${localName}\\b[\\s\\S]*?<\\/([\\w-]+:)?${localName}>`, 'i');
        const match = String(xmlText).match(withPrefixPattern);
        return match ? match[0] : null;
    }

    parseNodeByName(nodeXml, localName) {
        const parsed = this.parser.parse(nodeXml);
        return this.findByLocalName(parsed, localName);
    }

    findByLocalName(value, localName) {
        if (!value || typeof value !== 'object') {
            return null;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                const found = this.findByLocalName(item, localName);
                if (found) {
                    return found;
                }
            }
            return null;
        }

        for (const [key, entry] of Object.entries(value)) {
            const normalized = key.includes(':') ? key.split(':').pop() : key;
            if (normalized === localName) {
                return entry;
            }
            const nested = this.findByLocalName(entry, localName);
            if (nested) {
                return nested;
            }
        }
        return null;
    }

    buildNodeXml(localName, node) {
        if (!node) {
            return null;
        }
        return this.xmlBuilder.build({ [localName]: node });
    }

    extractProtocolInfoFromNode(protNode) {
        const infProt = protNode?.infProt || {};
        return {
            cStat: String(infProt?.cStat || ''),
            xMotivo: String(infProt?.xMotivo || ''),
            nProt: String(infProt?.nProt || ''),
            dhRecbto: String(infProt?.dhRecbto || '')
        };
    }

    buildAuthorizedResult({
        statusCode,
        message,
        protocolXml,
        rawRequestXml,
        rawResponseXml,
        receiptNumber,
        retNode
    }) {
        const protocolInfo = this.extractProtocolInfoFromNode(retNode?.protNFe);
        return {
            authorized: true,
            statusCode: protocolInfo.cStat || statusCode,
            message: protocolInfo.xMotivo || message,
            protocolNumber: protocolInfo.nProt || null,
            protocolDate: protocolInfo.dhRecbto || null,
            protocolXml,
            receiptNumber: receiptNumber || null,
            rawRequestXml,
            rawResponseXml
        };
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

module.exports = { NFeSefazService };
