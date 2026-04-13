const { createModularApp } = require('./src/modular/create-app');
const { config } = require('./src/modular/config/env');

const app = createModularApp();

app.listen(config.port, config.host, () => {
    const visibleHost = config.host === '0.0.0.0' ? 'localhost' : config.host;
    console.log(`EasyStore modular API rodando em http://${visibleHost}:${config.port}`);
    console.log(`Frontend de vendas separado: http://${visibleHost}:${config.port}/vendas`);
});

