class NFeLogger {
    constructor({ context = 'nfe' } = {}) {
        this.context = context;
    }

    info(step, message, details = null) {
        this.log('INFO', step, message, details);
    }

    warn(step, message, details = null) {
        this.log('WARN', step, message, details);
    }

    error(step, message, details = null) {
        this.log('ERROR', step, message, details);
    }

    log(level, step, message, details = null) {
        const timestamp = new Date().toISOString();
        if (details) {
            console.log(`[${timestamp}] [${level}] [${this.context}] [${step}] ${message}`, details);
            return;
        }
        console.log(`[${timestamp}] [${level}] [${this.context}] [${step}] ${message}`);
    }
}

module.exports = { NFeLogger };
