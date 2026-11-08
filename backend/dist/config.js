"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const web3_js_1 = require("@solana/web3.js");
dotenv_1.default.config();
// Default merchant wallet if not provided in environment
const DEFAULT_MERCHANT_WALLET = '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3';
let merchantWalletPubkey;
const merchantWalletStr = process.env.MERCHANT_WALLET || DEFAULT_MERCHANT_WALLET;
try {
    merchantWalletPubkey = new web3_js_1.PublicKey(merchantWalletStr.trim());
}
catch {
    merchantWalletPubkey = new web3_js_1.PublicKey(DEFAULT_MERCHANT_WALLET);
}
exports.config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'production',
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || '',
    solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    merchantName: process.env.MERCHANT_NAME || 'SolRoast & Craft Co.',
    merchantWallet: merchantWalletPubkey,
    merchantIcon: process.env.MERCHANT_ICON || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=128&q=80',
    corsOrigin: process.env.CORS_ORIGIN || '*',
};
