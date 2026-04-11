/**
 * REPOSITÓRIO POSTGRESQL (Produção)
 * Substitui FileTransactionRepository em produção
 * 
 * Instalação:
 * npm install pg pg-promise
 */

const pgp = require('pg-promise')();

class PostgresTransactionRepository {
  constructor(connectionString) {
    this.db = pgp(connectionString);
    this.tableName = 'transactions';
  }

  /**
   * Criar tabelas no banco de dados
   */
  async initialize() {
    try {
      await this.db.none(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(50) PRIMARY KEY,
          order_id VARCHAR(100) NOT NULL,
          amount INTEGER NOT NULL,
          installments INTEGER DEFAULT 1,
          description TEXT,
          
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(20),
          payment_method VARCHAR(50),
          
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          gateway_reference VARCHAR(255) UNIQUE,
          gateway_name VARCHAR(50),
          
          error_message TEXT,
          metadata JSONB,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_at TIMESTAMP,
          declined_at TIMESTAMP,
          
          INDEX idx_order_id (order_id),
          INDEX idx_gateway_ref (gateway_reference),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        );
      `);

      console.log('✅ Tabela de transações criada/verificada');
    } catch (error) {
      console.error('❌ Erro ao criar tabela:', error);
      throw error;
    }
  }

  /**
   * Salvar transação
   */
  async save(transaction) {
    try {
      const query = `
        INSERT INTO ${this.tableName} (
          id, order_id, amount, installments, description,
          customer_name, customer_email, customer_phone, payment_method,
          status, gateway_reference, gateway_name, error_message, metadata,
          created_at, updated_at, approved_at, declined_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16, $17, $18
        )
        ON CONFLICT (id) DO UPDATE SET
          status = $10,
          gateway_reference = $11,
          gateway_name = $12,
          error_message = $13,
          metadata = $14,
          updated_at = $16,
          approved_at = $17,
          declined_at = $18
      `;

      await this.db.none(query, [
        transaction.id,
        transaction.orderId,
        transaction.amount,
        transaction.installments,
        transaction.description,
        transaction.customerName,
        transaction.customerEmail,
        transaction.customerPhone,
        transaction.paymentMethod,
        transaction.status,
        transaction.gatewayReference,
        transaction.gatewayName,
        transaction.errorMessage,
        transaction.metadata ? JSON.stringify(transaction.metadata) : null,
        transaction.createdAt,
        transaction.updatedAt,
        transaction.approvedAt,
        transaction.declinedAt,
      ]);

      return transaction;
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      throw error;
    }
  }

  /**
   * Buscar por ID
   */
  async findById(id) {
    try {
      const result = await this.db.oneOrNone(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (!result) return null;

      // Reconstruir objeto Transaction
      const Transaction = require('../models/transaction');
      return new Transaction({
        ...result,
        metadata: result.metadata ? JSON.parse(result.metadata) : {},
      });
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  }

  /**
   * Buscar por referência do gateway
   */
  async findByGatewayReference(gatewayReference) {
    try {
      const result = await this.db.oneOrNone(
        `SELECT * FROM ${this.tableName} WHERE gateway_reference = $1`,
        [gatewayReference]
      );

      if (!result) return null;

      const Transaction = require('../models/transaction');
      return new Transaction({
        ...result,
        metadata: result.metadata ? JSON.parse(result.metadata) : {},
      });
    } catch (error) {
      console.error('Erro ao buscar por gateway reference:', error);
      throw error;
    }
  }

  /**
   * Buscar por orderId
   */
  async findByOrderId(orderId) {
    try {
      const results = await this.db.any(
        `SELECT * FROM ${this.tableName} WHERE order_id = $1 ORDER BY created_at DESC`,
        [orderId]
      );

      const Transaction = require('../models/transaction');
      return results.map(row => new Transaction({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      }));
    } catch (error) {
      console.error('Erro ao buscar por orderId:', error);
      throw error;
    }
  }

  /**
   * Buscar por status
   */
  async findByStatus(status) {
    try {
      const results = await this.db.any(
        `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`,
        [status]
      );

      const Transaction = require('../models/transaction');
      return results.map(row => new Transaction({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      }));
    } catch (error) {
      console.error('Erro ao buscar por status:', error);
      throw error;
    }
  }

  /**
   * Listar todas
   */
  async findAll(limit = null, offset = 0) {
    try {
      let query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;

      if (limit) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const results = await this.db.any(query);

      const Transaction = require('../models/transaction');
      return results.map(row => new Transaction({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      }));
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      throw error;
    }
  }

  /**
   * Deletar (soft delete)
   */
  async delete(id) {
    try {
      const result = await this.db.result(
        `UPDATE ${this.tableName} SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas
   */
  async getStatistics() {
    try {
      const result = await this.db.one(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_approved_amount,
          AVG(CASE WHEN status = 'approved' THEN amount ELSE NULL END) as avg_approved_amount
        FROM ${this.tableName}
      `);

      // Agrupar por gateway
      const byGateway = await this.db.any(`
        SELECT gateway_name, COUNT(*) as count
        FROM ${this.tableName}
        WHERE gateway_name IS NOT NULL
        GROUP BY gateway_name
      `);

      // Agrupar por status
      const byStatus = await this.db.any(`
        SELECT status, COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY status
      `);

      return {
        total: parseInt(result.total),
        byStatus: Object.fromEntries(
          byStatus.map(row => [row.status, parseInt(row.count)])
        ),
        byGateway: Object.fromEntries(
          byGateway.map(row => [row.gateway_name, parseInt(row.count)])
        ),
        totalAmount: parseInt(result.total_approved_amount || 0),
        averageAmount: result.avg_approved_amount ? parseInt(result.avg_approved_amount) : 0,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Reconciliação - Encontrar transações sem confirmação
   */
  async findPendingTransactions(minutesOld = 10) {
    try {
      const results = await this.db.any(`
        SELECT * FROM ${this.tableName}
        WHERE status IN ('pending', 'processing')
        AND created_at < NOW() - INTERVAL '${minutesOld} minutes'
        ORDER BY created_at ASC
      `);

      const Transaction = require('../models/transaction');
      return results.map(row => new Transaction({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      }));
    } catch (error) {
      console.error('Erro ao buscar transações pendentes:', error);
      throw error;
    }
  }

  /**
   * Relatório de período
   */
  async getReportByPeriod(startDate, endDate) {
    try {
      const result = await this.db.one(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined_count,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_approved_amount
        FROM ${this.tableName}
        WHERE created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);

      return {
        period: { start: startDate, end: endDate },
        total: parseInt(result.total),
        approved: parseInt(result.approved_count),
        declined: parseInt(result.declined_count),
        totalAmount: parseInt(result.total_approved_amount || 0),
      };
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Fechar conexão
   */
  async close() {
    await pgp.end();
  }
}

module.exports = PostgresTransactionRepository;

// ═══════════════════════════════════════════════════════
// COMO USAR EM PRODUÇÃO
// ═══════════════════════════════════════════════════════

/**
 * // server.js
 * 
 * const PostgresTransactionRepository = require('./payments/repositories/postgres-transaction-repository');
 * 
 * const connectionString = process.env.DATABASE_URL;
 * const repository = new PostgresTransactionRepository(connectionString);
 * await repository.initialize();
 * 
 * const { paymentService } = await PaymentSystem.initialize({
 *   repositoryPath: repository
 * });
 */
