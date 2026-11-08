"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantRouter = void 0;
const express_1 = require("express");
const db_js_1 = require("../db.js");
const config_js_1 = require("../config.js");
const solana_js_1 = require("../solana.js");
const web3_js_1 = require("@solana/web3.js");
exports.merchantRouter = (0, express_1.Router)();
// GET /api/merchant - Returns merchant wallet details, balance and store metrics
exports.merchantRouter.get('/', async (req, res) => {
    try {
        let balanceSol = 0;
        try {
            const lamports = await solana_js_1.connection.getBalance(config_js_1.config.merchantWallet);
            balanceSol = lamports / web3_js_1.LAMPORTS_PER_SOL;
        }
        catch (e) {
            console.warn('Could not fetch merchant devnet balance:', e.message);
        }
        // Query metrics from PostgreSQL (safely handling empty/fallback)
        let stats = {
            total_orders: '0',
            confirmed_orders: '0',
            pending_orders: '0',
            total_revenue_usd: '0',
            total_revenue_sol: '0',
        };
        try {
            const statsRes = await (0, db_js_1.query)(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
          COALESCE(SUM(total_usd) FILTER (WHERE status = 'confirmed'), 0) as total_revenue_usd,
          COALESCE(SUM(total_sol) FILTER (WHERE status = 'confirmed'), 0) as total_revenue_sol
        FROM orders
      `);
            if (statsRes.rows && statsRes.rows[0]) {
                stats = statsRes.rows[0];
            }
        }
        catch (dbErr) {
            console.warn('Orders metrics query note:', dbErr.message);
        }
        return res.json({
            success: true,
            data: {
                merchantName: config_js_1.config.merchantName,
                merchantWallet: config_js_1.config.merchantWallet.toBase58(),
                merchantIcon: config_js_1.config.merchantIcon,
                network: config_js_1.config.solanaNetwork,
                rpcUrl: config_js_1.config.solanaRpcUrl,
                balanceSol,
                metrics: {
                    totalOrders: parseInt(stats.total_orders || '0', 10),
                    confirmedOrders: parseInt(stats.confirmed_orders || '0', 10),
                    pendingOrders: parseInt(stats.pending_orders || '0', 10),
                    totalRevenueUsd: parseFloat(stats.total_revenue_usd || '0'),
                    totalRevenueSol: parseFloat(stats.total_revenue_sol || '0'),
                },
            },
        });
    }
    catch (err) {
        console.error('Error fetching merchant details:', err);
        return res.json({
            success: true,
            data: {
                merchantName: config_js_1.config.merchantName,
                merchantWallet: config_js_1.config.merchantWallet.toBase58(),
                merchantIcon: config_js_1.config.merchantIcon,
                network: config_js_1.config.solanaNetwork,
                rpcUrl: config_js_1.config.solanaRpcUrl,
                balanceSol: 0,
                metrics: {
                    totalOrders: 0,
                    confirmedOrders: 0,
                    pendingOrders: 0,
                    totalRevenueUsd: 0,
                    totalRevenueSol: 0,
                },
            },
        });
    }
});
// POST /api/merchant/airdrop - Request devnet airdrop to merchant wallet
exports.merchantRouter.post('/airdrop', async (req, res) => {
    try {
        const sig = await solana_js_1.connection.requestAirdrop(config_js_1.config.merchantWallet, 1 * web3_js_1.LAMPORTS_PER_SOL);
        const bh = await solana_js_1.connection.getLatestBlockhash();
        await solana_js_1.connection.confirmTransaction({
            signature: sig,
            blockhash: bh.blockhash,
            lastValidBlockHeight: bh.lastValidBlockHeight,
        });
        const newBalance = await solana_js_1.connection.getBalance(config_js_1.config.merchantWallet);
        return res.json({
            success: true,
            message: 'Airdrop successful',
            txSignature: sig,
            newBalanceSol: newBalance / web3_js_1.LAMPORTS_PER_SOL,
        });
    }
    catch (err) {
        console.error('Airdrop failed:', err);
        return res.status(500).json({ success: false, error: err.message || 'Devnet airdrop request failed' });
    }
});
