/**
 * Transaction Repository (JSON File)
 * Persistência de transações em arquivo JSON (para desenvolvimento)
 * 
 * ⚠️ IMPORTANTE: Para produção, usar banco de dados (PostgreSQL/MySQL)
 */

const fs = require('fs').promises;
const path = require('path');

class FileTransactionRepository {
  constructor(filePath = null) {
    this.filePath = filePath || path.join(__dirname, '../../data/transactions.json');
    this.transactions = new Map();
    this.initialized = false;
  }

  /**
   * Inicializa o repositório carregando dados do arquivo
   */
  async initialize() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      const transactions = JSON.parse(data);
      
      transactions.forEach(txn => {
        this.transactions.set(txn.id, txn);
      });
      
      this.initialized = true;
      console.log(`✅ Carregadas ${transactions.length} transações do arquivo`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📄 Arquivo de transações não existe, criando novo...');
        await this.saveToFile();
        this.initialized = true;
      } else {
        console.error('Erro ao carregar transações:', error);
        throw error;
      }
    }
  }

  /**
   * Salva transação
   */
  async save(transaction) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Converter Transaction object para JSON se necessário
    const data = transaction.toJSON ? transaction.toJSON() : transaction;
    
    this.transactions.set(transaction.id, {
      ...data,
      // Incluir dados extras se existir no objeto original
      gatewayReference: transaction.gatewayReference,
      gatewayName: transaction.gatewayName,
      status: transaction.status,
      errorMessage: transaction.errorMessage,
    });

    await this.saveToFile();
    return transaction;
  }

  /**
   * Busca transação por ID
   */
  async findById(id) {
    if (!this.initialized) {
      await this.initialize();
    }

    const data = this.transactions.get(id);
    if (!data) return null;

    // Reconstruir objeto Transaction
    const Transaction = require('../models/transaction');
    return new Transaction(data);
  }

  /**
   * Busca transação por referência do gateway
   */
  async findByGatewayReference(gatewayReference) {
    if (!this.initialized) {
      await this.initialize();
    }

    for (const [, txnData] of this.transactions) {
      if (txnData.gatewayReference === gatewayReference) {
        const Transaction = require('../models/transaction');
        return new Transaction(txnData);
      }
    }
    return null;
  }

  /**
   * Busca transações por ID do pedido
   */
  async findByOrderId(orderId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const transactions = [];
    for (const [, txnData] of this.transactions) {
      if (txnData.orderId === orderId) {
        const Transaction = require('../models/transaction');
        transactions.push(new Transaction(txnData));
      }
    }
    return transactions;
  }

  /**
   * Busca transações por status
   */
  async findByStatus(status) {
    if (!this.initialized) {
      await this.initialize();
    }

    const transactions = [];
    for (const [, txnData] of this.transactions) {
      if (txnData.status === status) {
        const Transaction = require('../models/transaction');
        transactions.push(new Transaction(txnData));
      }
    }
    return transactions;
  }

  /**
   * Lista todas as transações
   */
  async findAll(limit = null, offset = 0) {
    if (!this.initialized) {
      await this.initialize();
    }

    let transactions = Array.from(this.transactions.values());
    
    // Ordenar por data (mais recentes primeiro)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (limit) {
      transactions = transactions.slice(offset, offset + limit);
    }

    const Transaction = require('../models/transaction');
    return transactions.map(txnData => new Transaction(txnData));
  }

  /**
   * Remove transação (soft delete)
   */
  async delete(id) {
    if (!this.initialized) {
      await this.initialize();
    }

    const txn = this.transactions.get(id);
    if (!txn) return false;

    // Soft delete - marcar como deletado
    txn.deletedAt = new Date();
    this.transactions.set(id, txn);
    await this.saveToFile();
    return true;
  }

  /**
   * Salva dados no arquivo
   */
  async saveToFile() {
    try {
      const transactions = Array.from(this.transactions.values());
      const dir = path.dirname(this.filePath);
      
      // Criar diretório se não existir
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (e) {
        // Diretório pode já existir
      }

      await fs.writeFile(
        this.filePath,
        JSON.stringify(transactions, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de transações
   */
  async getStatistics() {
    if (!this.initialized) {
      await this.initialize();
    }

    const transactions = Array.from(this.transactions.values());
    const stats = {
      total: transactions.length,
      byStatus: {},
      byGateway: {},
      totalAmount: 0,
      averageAmount: 0,
    };

    transactions.forEach(txn => {
      // Por status
      stats.byStatus[txn.status] = (stats.byStatus[txn.status] || 0) + 1;
      
      // Por gateway
      stats.byGateway[txn.gatewayName] = (stats.byGateway[txn.gatewayName] || 0) + 1;
      
      // Valor total e média (apenas aprovados)
      if (txn.status === 'approved') {
        stats.totalAmount += txn.amount;
      }
    });

    const approved = stats.byStatus['approved'] || 0;
    stats.averageAmount = approved > 0 ? stats.totalAmount / approved : 0;

    return stats;
  }
}

module.exports = FileTransactionRepository;
