const fs = require('fs/promises');
const path = require('path');

class NFeStorageService {
    constructor(nfeConfig, logger) {
        this.nfeConfig = nfeConfig;
        this.logger = logger;
    }

    async storeXml({ xml, accessKey, type, statusCode }) {
        const now = new Date();
        const dir = path.join(
            this.nfeConfig.storageDir,
            String(now.getFullYear()),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        );
        await fs.mkdir(dir, { recursive: true });

        const safeType = String(type || 'nfe').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        const filename = `${accessKey}-${safeType}${statusCode ? `-${statusCode}` : ''}.xml`;
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, xml, 'utf8');
        this.logger.info('armazenarXML', 'XML armazenado em disco.', { filePath });

        if (this.nfeConfig.enforceRetention) {
            await this.cleanupExpiredFiles();
        }

        return filePath;
    }

    async storeJson({ payload, accessKey, type }) {
        const now = new Date();
        const dir = path.join(
            this.nfeConfig.storageDir,
            String(now.getFullYear()),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        );
        await fs.mkdir(dir, { recursive: true });

        const safeType = String(type || 'metadata').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        const filename = `${accessKey}-${safeType}.json`;
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, JSON.stringify(payload || {}, null, 2), 'utf8');
        return filePath;
    }

    async cleanupExpiredFiles() {
        const threshold = new Date();
        threshold.setFullYear(threshold.getFullYear() - this.nfeConfig.retentionYears);

        await this.walkAndDelete(this.nfeConfig.storageDir, threshold.getTime());
    }

    async walkAndDelete(currentPath, thresholdMs) {
        let entries = [];
        try {
            entries = await fs.readdir(currentPath, { withFileTypes: true });
        } catch (_error) {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                await this.walkAndDelete(fullPath, thresholdMs);
                continue;
            }

            try {
                const stats = await fs.stat(fullPath);
                if (stats.mtimeMs < thresholdMs) {
                    await fs.unlink(fullPath);
                    this.logger.info('armazenarXML', 'Arquivo antigo removido pela politica de retencao.', { fullPath });
                }
            } catch (_error) {
                // ignora falhas pontuais de limpeza
            }
        }
    }
}

module.exports = { NFeStorageService };
