"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_js_1 = require("./config.js");
const db_js_1 = require("./db.js");
const redis_js_1 = require("./redis.js");
const products_js_1 = require("./routes/products.js");
const orders_js_1 = require("./routes/orders.js");
const solana_pay_js_1 = require("./routes/solana-pay.js");
const merchant_js_1 = require("./routes/merchant.js");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: config_js_1.config.corsOrigin }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Healthcheck & Root
const healthHandler = (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        network: config_js_1.config.solanaNetwork,
        merchantWallet: config_js_1.config.merchantWallet.toBase58(),
        merchantName: config_js_1.config.merchantName,
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
app.get('/api', healthHandler);
app.get('/', healthHandler);
// Mount Routes (with and without /api prefix for robust reverse-proxy / service routing)
app.use('/api/products', products_js_1.productsRouter);
app.use('/products', products_js_1.productsRouter);
app.use('/api/orders', orders_js_1.ordersRouter);
app.use('/orders', orders_js_1.ordersRouter);
app.use('/api/solana-pay', solana_pay_js_1.solanaPayRouter);
app.use('/solana-pay', solana_pay_js_1.solanaPayRouter);
app.use('/api/merchant', merchant_js_1.merchantRouter);
app.use('/merchant', merchant_js_1.merchantRouter);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});
// Start server locally when not running in Vercel Serverless environment
if (process.env.VERCEL !== '1') {
    (async () => {
        try {
            if (config_js_1.config.databaseUrl) {
                (0, db_js_1.waitForDatabase)().catch((e) => console.warn('DB init notice:', e.message));
            }
            if (config_js_1.config.redisUrl) {
                (0, redis_js_1.connectRedis)().catch((e) => console.warn('Redis init notice:', e.message));
            }
            app.listen(config_js_1.config.port, '0.0.0.0', () => {
                console.log(`✨ Server running on http://0.0.0.0:${config_js_1.config.port}`);
            });
        }
        catch (err) {
            console.warn('Server start notice:', err.message);
        }
    })();
}
// Export for both ESM and CommonJS runtimes
exports.default = app;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
    module.exports.default = app;
}
