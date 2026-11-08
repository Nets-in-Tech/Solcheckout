"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const db_js_1 = require("../db.js");
const redis_js_1 = require("../redis.js");
exports.productsRouter = (0, express_1.Router)();
// GET /api/products - List all products with Redis caching & guaranteed seeding
exports.productsRouter.get('/', async (req, res) => {
    try {
        const category = req.query.category;
        const cacheKey = category && category !== 'All' ? `products:cat:${category}` : 'products:all';
        const cached = await (0, redis_js_1.getCached)(cacheKey);
        if (cached && cached.length > 0) {
            return res.json({ success: true, data: cached, source: 'cache' });
        }
        let sql = 'SELECT * FROM products';
        const params = [];
        if (category && category !== 'All') {
            sql += ' WHERE category = $1';
            params.push(category);
        }
        sql += ' ORDER BY id ASC';
        let result = await (0, db_js_1.query)(sql, params);
        // If database table is empty, auto-seed it immediately
        if (result.rows.length === 0) {
            console.log('Detected empty products table, seeding database now...');
            await (0, db_js_1.initializeAndSeedDatabase)();
            result = await (0, db_js_1.query)(sql, params);
        }
        // In case the DB is still initializing, provide seed items fallback with IDs
        let productsList = result.rows;
        if (productsList.length === 0) {
            productsList = db_js_1.SEED_PRODUCTS.map((p, idx) => ({
                id: idx + 1,
                ...p,
            }));
            if (category && category !== 'All') {
                productsList = productsList.filter((p) => p.category === category);
            }
        }
        await (0, redis_js_1.setCached)(cacheKey, productsList, 300); // 5 minutes TTL
        return res.json({ success: true, data: productsList, source: 'database' });
    }
    catch (err) {
        console.error('Error fetching products from DB, serving fallback catalog:', err.message);
        const category = req.query.category;
        let fallback = db_js_1.SEED_PRODUCTS.map((p, idx) => ({ id: idx + 1, ...p }));
        if (category && category !== 'All') {
            fallback = fallback.filter((p) => p.category === category);
        }
        return res.json({ success: true, data: fallback, source: 'fallback' });
    }
});
// GET /api/products/:id - Get single product
exports.productsRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `product:${id}`;
        const cached = await (0, redis_js_1.getCached)(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached, source: 'cache' });
        }
        const isNumeric = /^\d+$/.test(id);
        const sql = isNumeric
            ? 'SELECT * FROM products WHERE id = $1'
            : 'SELECT * FROM products WHERE slug = $1';
        const result = await (0, db_js_1.query)(sql, [id]);
        if (result.rows.length === 0) {
            // Check fallback
            const found = isNumeric
                ? db_js_1.SEED_PRODUCTS.find((_, i) => i + 1 === parseInt(id, 10))
                : db_js_1.SEED_PRODUCTS.find((p) => p.slug === id);
            if (found) {
                return res.json({ success: true, data: { id: 1, ...found }, source: 'fallback' });
            }
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        await (0, redis_js_1.setCached)(cacheKey, result.rows[0], 600);
        return res.json({ success: true, data: result.rows[0], source: 'database' });
    }
    catch (err) {
        console.error('Error fetching product:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
