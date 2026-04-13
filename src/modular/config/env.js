const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const config = {
    port: Number(process.env.MODULAR_PORT || process.env.PORT || 3333),
    host: process.env.HOST || '0.0.0.0',
    dataFilePath: path.join(projectRoot, 'data', 'modular-state.json'),
    projectRoot
};

module.exports = { config };

