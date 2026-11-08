import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

// Default merchant wallet if not provided in environment
const DEFAULT_MERCHANT_WALLET = '7VMv92GaPH3mn6Vt7sRzVeR4PMX8byDH5EU7KCTDQgM3';

let merchantWalletPubkey: PublicKey;
const merchantWalletStr = process.env.MERCHANT_WALLET || DEFAULT_MERCHANT_WALLET;

try {
  merchantWalletPubkey = new PublicKey(merchantWalletStr.trim());
} catch {
  merchantWalletPubkey = new PublicKey(DEFAULT_MERCHANT_WALLET);
}

export const config = {
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
