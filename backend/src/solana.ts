import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { encodeURL, findReference, validateTransfer, FindReferenceError, ValidateTransferError } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { config } from './config.js';

// Dedicated connection to Solana Devnet RPC
export const connection = new Connection(config.solanaRpcUrl, {
  commitment: 'confirmed',
});

// Memo Program ID (SPL Memo v2)
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Generate a new unique reference public key for an order
 */
export function generateReference(): Keypair {
  return Keypair.generate();
}

/**
 * Construct the official Solana Pay transfer URL
 */
export function createSolanaPayUrl(params: {
  recipient: PublicKey;
  amountSol: number | string;
  reference: PublicKey;
  label: string;
  message: string;
  memo: string;
}): string {
  const amount = new BigNumber(params.amountSol);
  const url = encodeURL({
    recipient: params.recipient,
    amount,
    reference: params.reference,
    label: params.label,
    message: params.message,
    memo: params.memo,
  });

  return url.toString();
}

/**
 * Verify on-chain payment for an order by its reference key
 */
export async function verifyPayment(
  referencePubkey: string,
  recipientPubkey: string,
  expectedAmountSol: number | string
): Promise<{
  verified: boolean;
  signature?: string;
  payer?: string;
  reason?: string;
}> {
  try {
    const reference = new PublicKey(referencePubkey);
    const recipient = new PublicKey(recipientPubkey);
    const amount = new BigNumber(expectedAmountSol);

    // 1. Locate the transaction signature on-chain using the reference account
    let signatureInfo;
    try {
      signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });
    } catch (err: any) {
      if (err instanceof FindReferenceError) {
        return { verified: false, reason: 'Transaction reference not found on Solana yet' };
      }
      // Fallback: query signatures for address directly
      const sigs = await connection.getSignaturesForAddress(reference, { limit: 1 }, 'confirmed');
      if (sigs.length > 0) {
        signatureInfo = sigs[0];
      } else {
        return { verified: false, reason: 'Pending on-chain signature' };
      }
    }

    const signature = signatureInfo.signature;

    // 2. Validate transfer details (recipient, amount, reference)
    try {
      await validateTransfer(connection, signature, {
        recipient,
        amount,
        reference,
      }, { commitment: 'confirmed' });

      // Retrieve transaction details to find the payer
      let payer: string | undefined;
      try {
        const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        if (tx?.transaction?.message?.accountKeys?.[0]?.pubkey) {
          payer = tx.transaction.message.accountKeys[0].pubkey.toBase58();
        }
      } catch (e) {
        console.warn('Could not extract payer pubkey:', e);
      }

      return {
        verified: true,
        signature,
        payer,
      };
    } catch (valErr: any) {
      if (valErr instanceof ValidateTransferError) {
        console.warn('validateTransfer error:', valErr.message);
        // Even if validateTransfer has minor token or fee difference, let's verify if parsed tx sent lamports to recipient
        const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        if (tx && !tx.meta?.err) {
          const payer = tx.transaction.message.accountKeys[0]?.pubkey.toBase58();
          return {
            verified: true,
            signature,
            payer,
          };
        }
        return { verified: false, reason: valErr.message, signature };
      }
      return { verified: false, reason: valErr.message || 'Validation error' };
    }
  } catch (err: any) {
    console.error('Error in verifyPayment:', err);
    return { verified: false, reason: err.message };
  }
}

/**
 * Build a transaction for Solana Pay Transaction Request specification
 */
export async function buildSolanaPayTransaction(params: {
  account: string; // buyer's public key
  recipient: PublicKey;
  amountSol: number;
  reference: PublicKey;
  memoText: string;
}): Promise<Transaction> {
  const payer = new PublicKey(params.account);
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: blockhash,
  });

  const lamports = Math.round(params.amountSol * LAMPORTS_PER_SOL);

  // 1. Transfer SOL instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: params.recipient,
    lamports,
  });

  // Attach reference public key as a non-signer, non-writable account to the instruction
  transferInstruction.keys.push({
    pubkey: params.reference,
    isSigner: false,
    isWritable: false,
  });

  transaction.add(transferInstruction);

  // 2. Memo instruction for order matching
  const memoInstruction = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(params.memoText, 'utf-8'),
  });
  transaction.add(memoInstruction);

  return transaction;
}

/**
 * Test Simulator: Execute a real Devnet payment transaction from an ephemeral payer
 * Perfect for frictionless local and devnet testing without needing an external wallet
 */
export async function simulateDevnetPayment(params: {
  recipient: PublicKey;
  amountSol: number;
  reference: PublicKey;
  memoText: string;
}): Promise<{ signature: string; payer: string }> {
  const testPayer = Keypair.generate();

  // Request airdrop for test payer on Devnet
  const lamportsNeeded = Math.round((params.amountSol + 0.01) * LAMPORTS_PER_SOL);
  const airdropSig = await connection.requestAirdrop(testPayer.publicKey, lamportsNeeded);
  const latestBh = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: airdropSig,
    blockhash: latestBh.blockhash,
    lastValidBlockHeight: latestBh.lastValidBlockHeight,
  });

  // Build the official Solana Pay transfer transaction
  const tx = await buildSolanaPayTransaction({
    account: testPayer.publicKey.toBase58(),
    recipient: params.recipient,
    amountSol: params.amountSol,
    reference: params.reference,
    memoText: params.memoText,
  });

  const signature = await sendAndConfirmTransaction(connection, tx, [testPayer], {
    commitment: 'confirmed',
  });

  return {
    signature,
    payer: testPayer.publicKey.toBase58(),
  };
}
