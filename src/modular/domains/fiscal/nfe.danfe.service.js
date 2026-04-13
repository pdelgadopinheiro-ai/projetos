const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { formatDecimal } = require('./nfe.utils');

class DanfeService {
    constructor(nfeConfig, logger) {
        this.nfeConfig = nfeConfig;
        this.logger = logger;
    }

    async generateDanfePdf({
        accessKey,
        protocolNumber,
        protocolDate,
        issueDate,
        emitter,
        recipient,
        items,
        totals
    }) {
        const now = new Date();
        const dir = path.join(
            this.nfeConfig.danfeDir,
            String(now.getFullYear()),
            String(now.getMonth() + 1).padStart(2, '0')
        );
        await fsPromises.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, `DANFE-${accessKey}.pdf`);

        const qrValue = `${this.nfeConfig.danfeQrBaseUrl}${encodeURIComponent(accessKey)}`;
        const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 0, width: 170 });
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

        await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 36 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            doc.fontSize(14).text('DANFE - Documento Auxiliar da NF-e', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).text(`Chave de acesso: ${accessKey}`);
            doc.text(`Protocolo: ${protocolNumber || '-'}`);
            doc.text(`Recebimento: ${protocolDate || '-'}`);
            doc.text(`Emissao: ${issueDate || '-'}`);

            doc.moveDown(0.7);
            doc.fontSize(11).text('Emitente');
            doc.fontSize(10).text(`${emitter?.xNome || '-'}`);
            doc.text(`CNPJ: ${emitter?.cnpj || '-'}`);
            doc.text(`IE: ${emitter?.ie || '-'}`);

            doc.moveDown(0.5);
            doc.fontSize(11).text('Destinatario');
            doc.fontSize(10).text(`${recipient?.name || recipient?.xNome || '-'}`);
            doc.text(`Documento: ${recipient?.document || '-'}`);
            doc.text(`Cidade/UF: ${recipient?.city || '-'} / ${recipient?.uf || '-'}`);

            doc.moveDown(0.8);
            doc.fontSize(11).text('Itens');
            doc.moveDown(0.3);
            this.drawItemsTable(doc, items || []);

            doc.moveDown(0.8);
            doc.fontSize(11).text('Totais');
            doc.fontSize(10).text(`Valor dos produtos: R$ ${formatDecimal(totals?.vProd || 0)}`);
            doc.text(`Valor da nota: R$ ${formatDecimal(totals?.vNF || 0)}`);

            doc.image(qrBuffer, doc.page.width - 210, 72, { width: 145 });
            doc.fontSize(8).text('QR Code consulta da NF-e', doc.page.width - 210, 225, {
                width: 145,
                align: 'center'
            });

            doc.end();
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        this.logger.info('gerarDANFE', 'DANFE em PDF gerado com sucesso.', { filePath });
        return filePath;
    }

    drawItemsTable(doc, items) {
        const headers = ['Codigo', 'Descricao', 'Qtd', 'Unitario', 'Subtotal'];
        const colX = [36, 110, 350, 410, 480];
        const rowHeight = 18;
        let y = doc.y;

        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((header, index) => {
            doc.text(header, colX[index], y, { width: index === 1 ? 230 : 70 });
        });
        y += rowHeight;
        doc.moveTo(36, y - 2).lineTo(560, y - 2).stroke('#8da49a');

        doc.font('Helvetica');
        items.forEach((item) => {
            if (y > 735) {
                doc.addPage();
                y = 48;
            }
            doc.text(String(item.code || '-'), colX[0], y, { width: 70 });
            doc.text(String(item.description || '-').slice(0, 48), colX[1], y, { width: 230 });
            doc.text(formatDecimal(item.quantity || 0, 4), colX[2], y, { width: 55, align: 'right' });
            doc.text(`R$ ${formatDecimal(item.unitPrice || 0)}`, colX[3], y, { width: 65, align: 'right' });
            doc.text(`R$ ${formatDecimal(item.lineTotal || 0)}`, colX[4], y, { width: 70, align: 'right' });
            y += rowHeight;
        });

        doc.y = y;
    }
}

module.exports = { DanfeService };
