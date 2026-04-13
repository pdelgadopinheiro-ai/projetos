const fs = require('fs');
const forge = require('node-forge');
const { SignedXml } = require('xml-crypto');
const { ValidationError } = require('../../shared/errors');

class NFeSignatureService {
    constructor(nfeConfig, logger) {
        this.nfeConfig = nfeConfig;
        this.logger = logger;
        this.cachedCertificate = null;
    }

    signNFeXml(unsignedNfeXml) {
        const certificate = this.getCertificateMaterial();
        const signature = new SignedXml({
            privateKey: certificate.privateKeyPem,
            signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
            canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        });

        signature.keyInfoProvider = {
            getKeyInfo: () => `<X509Data><X509Certificate>${certificate.base64Certificate}</X509Certificate></X509Data>`
        };

        signature.addReference({
            xpath: "//*[local-name(.)='infNFe']",
            transforms: [
                'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
                'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
            ],
            digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
        });

        signature.computeSignature(unsignedNfeXml, {
            location: {
                reference: "//*[local-name(.)='infNFe']",
                action: 'after'
            }
        });

        this.logger.info('assinarXML', 'XML da NF-e assinado digitalmente com certificado A1.');
        return signature.getSignedXml();
    }

    getCertificateMaterial() {
        if (this.cachedCertificate) {
            return this.cachedCertificate;
        }

        const pfxBuffer = this.resolvePfxBuffer();
        const asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer.toString('binary')));
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, this.nfeConfig.certPassword);

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]
            || p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]
            || [];
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];

        if (!keyBags.length || !certBags.length) {
            throw new ValidationError('Nao foi possivel extrair chave privada/certificado do arquivo .pfx.');
        }

        const privateKeyPem = forge.pki.privateKeyToPem(keyBags[0].key);
        const certificatePem = forge.pki.certificateToPem(certBags[0].cert);
        const base64Certificate = certificatePem
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .replace(/\r?\n/g, '');

        this.cachedCertificate = {
            privateKeyPem,
            certificatePem,
            base64Certificate,
            pfxBuffer
        };
        return this.cachedCertificate;
    }

    resolvePfxBuffer() {
        if (this.nfeConfig.certPath && fs.existsSync(this.nfeConfig.certPath)) {
            return fs.readFileSync(this.nfeConfig.certPath);
        }

        const rawBase64 = String(this.nfeConfig.certBase64 || '').trim();
        if (rawBase64) {
            const sanitized = rawBase64
                .replace(/^data:application\/(?:x-pkcs12|pkcs12);base64,/i, '')
                .replace(/\s+/g, '');
            try {
                const decoded = Buffer.from(sanitized, 'base64');
                if (!decoded.length) {
                    throw new Error('Certificado base64 vazio.');
                }
                return decoded;
            } catch (_error) {
                throw new ValidationError('NFE_CERT_BASE64 invalido ou corrompido.');
            }
        }

        throw new ValidationError(`Certificado A1 nao encontrado em ${this.nfeConfig.certPath} e NFE_CERT_BASE64 nao foi informado.`);
    }

    getTlsCredentials() {
        const certificate = this.getCertificateMaterial();
        return {
            pfx: certificate.pfxBuffer,
            passphrase: this.nfeConfig.certPassword
        };
    }
}

module.exports = { NFeSignatureService };
