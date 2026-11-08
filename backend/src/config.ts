import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

// Ensure required database configuration exists
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set in environment. Using connection parameters.');
}

// Merchant wallet address (public key only - no private keys are ever stored or needed)
const merchantWalletStr = process.env.MERCHANT_WALLET;
let merchantWalletPubkey: PublicKey;

if (merchantWalletStr && merchantWalletStr.trim() !== '') {
  try {
    merchantWalletPubkey = new PublicKey(merchantWalletStr.trim());
  } catch (err) {
    console.error('Invalid MERCHANT_WALLET public key in environment:', merchantWalletStr);
    throw new Error('Invalid MERCHANT_WALLET provided in environment.');
  }
} else {
  throw new Error('MERCHANT_WALLET environment variable is required.');
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
  solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  merchantName: process.env.MERCHANT_NAME || 'SolRoast & Craft Co.',
  merchantWallet: merchantWalletPubkey,
  merchantIcon: process.env.MERCHANT_ICON || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=128&q=80',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
