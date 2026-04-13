const { XMLBuilder } = require('fast-xml-parser');
const { ValidationError } = require('../../shared/errors');
const {
    onlyDigits,
    padLeft,
    formatDecimal,
    generateRandomDigits,
    buildAccessKey,
    formatDateTimeWithTimezone,
    mapPaymentToTPag,
    normalizeDocument,
} = require('./nfe.utils');

class NFeXmlService {
    constructor(nfeConfig, logger) {
        this.nfeConfig = nfeConfig;
        this.logger = logger;
        this.xmlBuilder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            suppressBooleanAttributes: false,
            format: false
        });
    }

    buildUnsignedNFeXml(rawSale) {
        const sale = this.normalizeSaleData(rawSale);
        const issueDate = sale.issueDate || new Date();
        const serie = Number(sale.serie || this.nfeConfig.defaults.serie || 1);
        const invoiceNumber = Number(sale.invoiceNumber || Date.now().toString().slice(-9));
        const cNF = padLeft(sale.randomCode || generateRandomDigits(8), 8);
        const accessKey = buildAccessKey({
            cUF: this.nfeConfig.emitter.cUF,
            emissionDate: issueDate,
            cnpj: this.nfeConfig.emitter.cnpj,
            model: this.nfeConfig.defaults.model,
            serie,
            nNF: invoiceNumber,
            tpEmis: '1',
            cNF
        });
        const totals = this.calculateTotals(sale.items);
        const digestValue = `${accessKey}`;

        const nfeObject = {
            NFe: {
                '@_xmlns': 'http://www.portalfiscal.inf.br/nfe',
                infNFe: {
                    '@_Id': `NFe${accessKey}`,
                    '@_versao': this.nfeConfig.nfeVersion,
                    ide: {
                        cUF: this.nfeConfig.emitter.cUF,
                        cNF,
                        natOp: sale.nature || this.nfeConfig.defaults.natOp,
                        mod: this.nfeConfig.defaults.model,
                        serie: String(serie),
                        nNF: String(invoiceNumber),
                        dhEmi: formatDateTimeWithTimezone(issueDate),
                        tpNF: String(sale.operationType || 1),
                        idDest: String(sale.destinationIndicator || 1),
                        cMunFG: this.nfeConfig.emitter.cMun,
                        tpImp: '1',
                        tpEmis: '1',
                        cDV: accessKey.slice(-1),
                        tpAmb: this.nfeConfig.tpAmb,
                        finNFe: String(sale.purpose || 1),
                        indFinal: String(sale.consumerFinal || 1),
                        indPres: String(sale.presenceIndicator || 1),
                        procEmi: '0',
                        verProc: sale.processVersion || 'EasyStore-NFe-1.0'
                    },
                    emit: {
                        CNPJ: onlyDigits(this.nfeConfig.emitter.cnpj),
                        xNome: this.nfeConfig.emitter.xNome,
                        ...(this.nfeConfig.emitter.xFant ? { xFant: this.nfeConfig.emitter.xFant } : {}),
                        enderEmit: {
                            xLgr: this.nfeConfig.emitter.address.xLgr,
                            nro: this.nfeConfig.emitter.address.nro,
                            ...(this.nfeConfig.emitter.address.xCpl ? { xCpl: this.nfeConfig.emitter.address.xCpl } : {}),
                            xBairro: this.nfeConfig.emitter.address.xBairro,
                            cMun: this.nfeConfig.emitter.cMun,
                            xMun: this.nfeConfig.emitter.address.xMun,
                            UF: this.nfeConfig.emitter.uf,
                            CEP: onlyDigits(this.nfeConfig.emitter.address.cep),
                            cPais: this.nfeConfig.emitter.cPais,
                            xPais: this.nfeConfig.emitter.xPais,
                            ...(this.nfeConfig.emitter.fone ? { fone: onlyDigits(this.nfeConfig.emitter.fone) } : {})
                        },
                        IE: onlyDigits(this.nfeConfig.emitter.ie),
                        ...(this.nfeConfig.emitter.im ? { IM: this.nfeConfig.emitter.im } : {}),
                        CRT: this.nfeConfig.emitter.crt
                    },
                    dest: this.buildDestination(sale.customer),
                    det: sale.items.map((item, index) => this.buildItem(index + 1, item)),
                    total: {
                        ICMSTot: {
                            vBC: formatDecimal(totals.vBC),
                            vICMS: formatDecimal(totals.vICMS),
                            vICMSDeson: '0.00',
                            vFCP: '0.00',
                            vBCST: '0.00',
                            vST: '0.00',
                            vFCPST: '0.00',
                            vFCPSTRet: '0.00',
                            vProd: formatDecimal(totals.vProd),
                            vFrete: formatDecimal(totals.vFrete),
                            vSeg: '0.00',
                            vDesc: formatDecimal(totals.vDesc),
                            vII: '0.00',
                            vIPI: formatDecimal(totals.vIPI),
                            vIPIDevol: '0.00',
                            vPIS: formatDecimal(totals.vPIS),
                            vCOFINS: formatDecimal(totals.vCOFINS),
                            vOutro: formatDecimal(totals.vOutro),
                            vNF: formatDecimal(totals.vNF)
                        }
                    },
                    transp: {
                        modFrete: String(sale.freightMode || 9)
                    },
                    pag: {
                        detPag: {
                            tPag: mapPaymentToTPag(sale.paymentMethod),
                            vPag: formatDecimal(totals.vNF)
                        }
                    },
                    ...(sale.additionalInfo
                        ? { infAdic: { infCpl: sale.additionalInfo } }
                        : {})
                }
            }
        };

        const xml = this.xmlBuilder.build(nfeObject);
        this.logger.info('gerarXML', 'XML NF-e montado com sucesso.', {
            accessKey,
            items: sale.items.length,
            total: totals.vNF
        });

        return {
            accessKey,
            invoiceNumber,
            serie,
            issueDate: issueDate.toISOString(),
            xml: `<?xml version="1.0" encoding="UTF-8"?>${xml}`,
            totals,
            digestValue
        };
    }

    buildEnviNFeXml({ signedNFeXml, loteId, indSinc = '1' }) {
        const nfeXml = String(signedNFeXml || '')
            .replace(/<\?xml[^>]*\?>/gi, '')
            .trim();
        const idLote = padLeft(loteId || Date.now().toString().slice(-15), 15);
        return `<?xml version="1.0" encoding="UTF-8"?><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="${this.nfeConfig.nfeVersion}"><idLote>${idLote}</idLote><indSinc>${indSinc}</indSinc>${nfeXml}</enviNFe>`;
    }

    buildConsReciNFeXml(receiptNumber) {
        const nRec = onlyDigits(receiptNumber);
        return `<?xml version="1.0" encoding="UTF-8"?><consReciNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="${this.nfeConfig.nfeVersion}"><tpAmb>${this.nfeConfig.tpAmb}</tpAmb><nRec>${nRec}</nRec></consReciNFe>`;
    }

    buildNFeProcXml({ signedNFeXml, protNFeXml }) {
        const nfeXml = String(signedNFeXml || '').replace(/<\?xml[^>]*\?>/gi, '').trim();
        const protocolXml = String(protNFeXml || '').replace(/<\?xml[^>]*\?>/gi, '').trim();
        return `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="${this.nfeConfig.nfeVersion}">${nfeXml}${protocolXml}</nfeProc>`;
    }

    normalizeSaleData(rawSale) {
        const sale = rawSale || {};
        const items = Array.isArray(sale.items) ? sale.items : [];
        if (!items.length) {
            throw new ValidationError('dadosVenda.items obrigatorio com pelo menos um item.');
        }

        if (!this.nfeConfig.emitter.cnpj || !this.nfeConfig.emitter.ie || !this.nfeConfig.emitter.xNome) {
            throw new ValidationError('Configuracao fiscal incompleta no .env (emitente).');
        }

        const normalizedItems = items.map((item, index) => {
            const quantity = Number(item.quantity ?? item.qtd);
            const unitPrice = Number(item.unitPrice ?? item.preco ?? item.price);
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new ValidationError(`Item ${index + 1} com quantidade invalida.`);
            }
            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                throw new ValidationError(`Item ${index + 1} com preco unitario invalido.`);
            }

            const ncm = onlyDigits(item.ncm || this.nfeConfig.defaults.ncm).padStart(8, '0').slice(0, 8);
            const cfop = onlyDigits(item.cfop || this.nfeConfig.defaults.cfop).padStart(4, '0').slice(0, 4);
            const barcode = onlyDigits(item.barcode || item.codigoBarras || '');
            const gtin = barcode.length === 8 || barcode.length === 13 ? barcode : 'SEM GTIN';
            const lineTotal = Number((quantity * unitPrice).toFixed(2));
            const icmsRate = Number(item?.taxes?.icmsRate ?? item?.icmsRate ?? 18);
            const pisRate = Number(item?.taxes?.pisRate ?? item?.pisRate ?? 1.65);
            const cofinsRate = Number(item?.taxes?.cofinsRate ?? item?.cofinsRate ?? 7.6);

            return {
                code: String(item.code || item.codigo || item.productId || `ITEM-${index + 1}`).slice(0, 60),
                description: String(item.description || item.nome || item.name || `Produto ${index + 1}`).slice(0, 120),
                ncm,
                cfop,
                unit: String(item.unit || item.unidade || 'UN').slice(0, 6),
                quantity,
                unitPrice,
                lineTotal,
                gtin,
                icmsOrigin: String(item?.taxes?.icmsOrigin ?? item?.icmsOrigin ?? '0'),
                icmsCst: String(item?.taxes?.icmsCst ?? item?.icmsCst ?? this.nfeConfig.defaults.cstIcms),
                pisCst: String(item?.taxes?.pisCst ?? item?.pisCst ?? this.nfeConfig.defaults.cstPis),
                cofinsCst: String(item?.taxes?.cofinsCst ?? item?.cofinsCst ?? this.nfeConfig.defaults.cstCofins),
                icmsRate,
                pisRate,
                cofinsRate
            };
        });

        return {
            ...sale,
            issueDate: sale.issueDate ? new Date(sale.issueDate) : new Date(),
            customer: sale.customer || {},
            items: normalizedItems,
            paymentMethod: sale.paymentMethod || sale.pagamento || 'dinheiro',
            additionalInfo: sale.additionalInfo || sale.observacoes || ''
        };
    }

    buildDestination(customer) {
        const normalized = customer || {};
        const documentNode = normalizeDocument(normalized.document || normalized.cpfCnpj || '');
        const destinationName = String(normalized.name || normalized.nome || 'CONSUMIDOR FINAL');
        const cityCode = String(normalized?.address?.cityCode || normalized.cityCode || this.nfeConfig.emitter.cMun);
        const cityName = String(normalized?.address?.city || normalized.city || this.nfeConfig.emitter.address.xMun);
        const uf = String(normalized?.address?.uf || normalized.uf || this.nfeConfig.emitter.uf).toUpperCase();
        const cep = onlyDigits(normalized?.address?.cep || normalized.cep || '');
        const address = normalized?.address || {};

        return {
            ...(documentNode || { CNPJ: '00000000000000' }),
            xNome: destinationName,
            enderDest: {
                xLgr: String(address.street || address.xLgr || 'NAO INFORMADO'),
                nro: String(address.number || address.nro || 'S/N'),
                ...(address.complement ? { xCpl: String(address.complement) } : {}),
                xBairro: String(address.neighborhood || address.xBairro || 'CENTRO'),
                cMun: cityCode,
                xMun: cityName,
                UF: uf,
                ...(cep ? { CEP: cep } : {}),
                cPais: this.nfeConfig.emitter.cPais,
                xPais: this.nfeConfig.emitter.xPais,
                ...(normalized.phone ? { fone: onlyDigits(normalized.phone) } : {})
            },
            indIEDest: '9',
            ...(normalized.email ? { email: String(normalized.email).slice(0, 60) } : {})
        };
    }

    buildItem(itemNumber, item) {
        const vBC = Number((item.lineTotal).toFixed(2));
        const vICMS = Number((vBC * (item.icmsRate / 100)).toFixed(2));
        const vPIS = Number((item.lineTotal * (item.pisRate / 100)).toFixed(2));
        const vCOFINS = Number((item.lineTotal * (item.cofinsRate / 100)).toFixed(2));

        return {
            '@_nItem': String(itemNumber),
            prod: {
                cProd: item.code,
                cEAN: item.gtin,
                xProd: item.description,
                NCM: item.ncm,
                CFOP: item.cfop,
                uCom: item.unit,
                qCom: formatDecimal(item.quantity, 4),
                vUnCom: formatDecimal(item.unitPrice, 10),
                vProd: formatDecimal(item.lineTotal),
                cEANTrib: item.gtin,
                uTrib: item.unit,
                qTrib: formatDecimal(item.quantity, 4),
                vUnTrib: formatDecimal(item.unitPrice, 10),
                indTot: '1'
            },
            imposto: {
                ICMS: {
                    ICMS00: {
                        orig: item.icmsOrigin,
                        CST: item.icmsCst,
                        modBC: '3',
                        vBC: formatDecimal(vBC),
                        pICMS: formatDecimal(item.icmsRate),
                        vICMS: formatDecimal(vICMS)
                    }
                },
                PIS: {
                    PISAliq: {
                        CST: item.pisCst,
                        vBC: formatDecimal(item.lineTotal),
                        pPIS: formatDecimal(item.pisRate),
                        vPIS: formatDecimal(vPIS)
                    }
                },
                COFINS: {
                    COFINSAliq: {
                        CST: item.cofinsCst,
                        vBC: formatDecimal(item.lineTotal),
                        pCOFINS: formatDecimal(item.cofinsRate),
                        vCOFINS: formatDecimal(vCOFINS)
                    }
                }
            }
        };
    }

    calculateTotals(items) {
        return items.reduce((acc, item) => {
            const vBC = Number((item.lineTotal).toFixed(2));
            const vICMS = Number((vBC * (item.icmsRate / 100)).toFixed(2));
            const vPIS = Number((item.lineTotal * (item.pisRate / 100)).toFixed(2));
            const vCOFINS = Number((item.lineTotal * (item.cofinsRate / 100)).toFixed(2));
            acc.vBC += vBC;
            acc.vICMS += vICMS;
            acc.vProd += item.lineTotal;
            acc.vPIS += vPIS;
            acc.vCOFINS += vCOFINS;
            return acc;
        }, {
            vBC: 0,
            vICMS: 0,
            vProd: 0,
            vFrete: 0,
            vDesc: 0,
            vIPI: 0,
            vPIS: 0,
            vCOFINS: 0,
            vOutro: 0,
            vNF: Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2))
        });
    }
}

module.exports = { NFeXmlService };
