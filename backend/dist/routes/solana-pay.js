"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solanaPayRouter = void 0;
const express_1 = require("express");
const db_js_1 = require("../db.js");
const orders_js_1 = require("./orders.js");
const config_js_1 = require("../config.js");
const solana_js_1 = require("../solana.js");
const web3_js_1 = require("@solana/web3.js");
exports.solanaPayRouter = (0, express_1.Router)();
/**
 * Solana Pay Transaction Request Specification
 * Specification reference: https://github.com/solana-labs/solana-pay/blob/master/SPEC.md
 *
 * 1. GET /api/solana-pay/tx
 * Returns merchant branding (label and icon)
 */
exports.solanaPayRouter.get('/tx', (req, res) => {
    return res.json({
        label: config_js_1.config.merchantName,
        icon: config_js_1.config.merchantIcon,
    });
});
/**
 * 2. POST /api/solana-pay/tx?orderId=...
 * Accepts buyer's account and constructs the transaction
 */
exports.solanaPayRouter.post('/tx', async (req, res) => {
    try {
        const { account } = req.body;
        const orderId = req.query.orderId;
        if (!account) {
            return res.status(400).json({ error: 'Missing account in body' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Missing orderId parameter' });
        }
        // Validate account public key
        try {
            new web3_js_1.PublicKey(account);
        }
        catch {
            return res.status(400).json({ error: 'Invalid account public key' });
        }
        // Fetch order
        let order = null;
        if (db_js_1.pool) {
            try {
                const orderRes = await (0, db_js_1.query)('SELECT * FROM orders WHERE id::text = $1 OR order_number = $1', [orderId]);
                if (orderRes.rows.length > 0) {
                    order = orderRes.rows[0];
                }
            }
            catch { }
        }
        if (!order) {
            order = orders_js_1.inMemoryOrders.get(orderId);
        }
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (order.status === 'confirmed') {
            return res.status(400).json({ error: 'Order already paid and confirmed' });
        }
        // Build the Solana Pay compliant transaction
        const tx = await (0, solana_js_1.buildSolanaPayTransaction)({
            account,
            recipient: new web3_js_1.PublicKey(order.recipient_pubkey),
            amountSol: parseFloat(order.total_sol),
            reference: new web3_js_1.PublicKey(order.reference_pubkey),
            memoText: `Order ${order.order_number} - ${config_js_1.config.merchantName}`,
        });
        // Serialize transaction without signatures for client wallet signing
        const serialized = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });
        const base64Tx = serialized.toString('base64');
        return res.json({
            transaction: base64Tx,
            message: `Complete payment of ${order.total_sol} SOL for ${order.order_number}`,
        });
    }
    catch (err) {
        console.error('Error generating transaction request:', err);
        return res.status(500).json({ error: err.message || 'Internal error building transaction' });
    }
});
