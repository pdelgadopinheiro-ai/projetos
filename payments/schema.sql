CREATE TABLE IF NOT EXISTS payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(80) NOT NULL,
    provider_name VARCHAR(80) NOT NULL,
    terminal_provider VARCHAR(80) NOT NULL,
    terminal_model VARCHAR(120) NOT NULL,
    terminal_serial_number VARCHAR(120) NOT NULL DEFAULT '',
    payment_method VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    provider_transaction_id VARCHAR(120) NOT NULL DEFAULT '',
    authorization_code VARCHAR(60) NOT NULL DEFAULT '',
    raw_response JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
