const { parseOptionalDate } = require('../../shared/validators');

class ReportsService {
    constructor(stateStore) {
        this.stateStore = stateStore;
    }

    async getSalesSummary({ from = null, to = null } = {}) {
        const state = await this.stateStore.read();
        const fromDate = parseOptionalDate(from);
        const toDate = parseOptionalDate(to);
        const sales = state.sales.filter((sale) => this.inRange(sale.createdAt, fromDate, toDate));

        const grossRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const totalItems = sales.reduce((sum, sale) => (
            sum + (sale.items || []).reduce((acc, item) => acc + Number(item.quantity || 0), 0)
        ), 0);

        return {
            period: {
                from: fromDate ? fromDate.toISOString() : null,
                to: toDate ? toDate.toISOString() : null
            },
            totalSales: sales.length,
            totalItems,
            grossRevenue: Number(grossRevenue.toFixed(2))
        };
    }

    async getTopProducts({ from = null, to = null, limit = 10 } = {}) {
        const state = await this.stateStore.read();
        const fromDate = parseOptionalDate(from);
        const toDate = parseOptionalDate(to);
        const parsedLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
        const sales = state.sales.filter((sale) => this.inRange(sale.createdAt, fromDate, toDate));

        const ranking = new Map();
        sales.forEach((sale) => {
            (sale.items || []).forEach((item) => {
                const current = ranking.get(item.productId) || {
                    productId: item.productId,
                    code: item.code,
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
                current.quantity += Number(item.quantity || 0);
                current.revenue += Number(item.subtotal || 0);
                ranking.set(item.productId, current);
            });
        });

        return Array.from(ranking.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, parsedLimit)
            .map((item) => ({
                ...item,
                revenue: Number(item.revenue.toFixed(2))
            }));
    }

    async getInventorySnapshot() {
        const state = await this.stateStore.read();
        const totalProducts = state.products.length;
        const totalStockUnits = state.products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
        const lowStockItems = state.products.filter((product) => (
            Number(product.stock || 0) <= Number(product.minStock || 0)
        ));

        return {
            totalProducts,
            totalStockUnits: Number(totalStockUnits.toFixed(3)),
            lowStockCount: lowStockItems.length,
            lowStockItems
        };
    }

    inRange(dateValue, fromDate, toDate) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return false;
        }
        if (fromDate && date < fromDate) {
            return false;
        }
        if (toDate && date > toDate) {
            return false;
        }
        return true;
    }
}

module.exports = { ReportsService };

