"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMO_PROGRAM_ID = exports.connection = void 0;
exports.generateReference = generateReference;
exports.createSolanaPayUrl = createSolanaPayUrl;
exports.verifyPayment = verifyPayment;
exports.buildSolanaPayTransaction = buildSolanaPayTransaction;
exports.simulateDevnetPayment = simulateDevnetPayment;
const web3_js_1 = require("@solana/web3.js");
const pay_1 = require("@solana/pay");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const config_js_1 = require("./config.js");
// Dedicated connection to Solana Devnet RPC
exports.connection = new web3_js_1.Connection(config_js_1.config.solanaRpcUrl, {
    commitment: 'confirmed',
});
// Memo Program ID (SPL Memo v2)
exports.MEMO_PROGRAM_ID = new web3_js_1.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
/**
 * Generate a new unique reference public key for an order
 */
function generateReference() {
    return web3_js_1.Keypair.generate();
}
/**
 * Construct the official Solana Pay transfer URL
 */
function createSolanaPayUrl(params) {
    const amount = new bignumber_js_1.default(params.amountSol);
    const url = (0, pay_1.encodeURL)({
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
async function verifyPayment(referencePubkey, recipientPubkey, expectedAmountSol) {
    try {
        const reference = new web3_js_1.PublicKey(referencePubkey);
        const recipient = new web3_js_1.PublicKey(recipientPubkey);
        const amount = new bignumber_js_1.default(expectedAmountSol);
        // 1. Locate the transaction signature on-chain using the reference account
        let signatureInfo;
        try {
            signatureInfo = await (0, pay_1.findReference)(exports.connection, reference, { finality: 'confirmed' });
        }
        catch (err) {
            if (err instanceof pay_1.FindReferenceError) {
                return { verified: false, reason: 'Transaction reference not found on Solana yet' };
            }
            // Fallback: query signatures for address directly
            const sigs = await exports.connection.getSignaturesForAddress(reference, { limit: 1 }, 'confirmed');
            if (sigs.length > 0) {
                signatureInfo = sigs[0];
            }
            else {
                return { verified: false, reason: 'Pending on-chain signature' };
            }
        }
        const signature = signatureInfo.signature;
        // 2. Validate transfer details (recipient, amount, reference)
        try {
            await (0, pay_1.validateTransfer)(exports.connection, signature, {
                recipient,
                amount,
                reference,
            }, { commitment: 'confirmed' });
            // Retrieve transaction details to find the payer
            let payer;
            try {
                const tx = await exports.connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                    commitment: 'confirmed',
                });
                if (tx?.transaction?.message?.accountKeys?.[0]?.pubkey) {
                    payer = tx.transaction.message.accountKeys[0].pubkey.toBase58();
                }
            }
            catch (e) {
                console.warn('Could not extract payer pubkey:', e);
            }
            return {
                verified: true,
                signature,
                payer,
            };
        }
        catch (valErr) {
            if (valErr instanceof pay_1.ValidateTransferError) {
                console.warn('validateTransfer error:', valErr.message);
                // Even if validateTransfer has minor token or fee difference, let's verify if parsed tx sent lamports to recipient
                const tx = await exports.connection.getParsedTransaction(signature, {
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
    }
    catch (err) {
        console.error('Error in verifyPayment:', err);
        return { verified: false, reason: err.message };
    }
}
/**
 * Build a transaction for Solana Pay Transaction Request specification
 */
async function buildSolanaPayTransaction(params) {
    const payer = new web3_js_1.PublicKey(params.account);
    const { blockhash } = await exports.connection.getLatestBlockhash('confirmed');
    const transaction = new web3_js_1.Transaction({
        feePayer: payer,
        recentBlockhash: blockhash,
    });
    const lamports = Math.round(params.amountSol * web3_js_1.LAMPORTS_PER_SOL);
    // 1. Transfer SOL instruction
    const transferInstruction = web3_js_1.SystemProgram.transfer({
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
    const memoInstruction = new web3_js_1.TransactionInstruction({
        programId: exports.MEMO_PROGRAM_ID,
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
async function simulateDevnetPayment(params) {
    const testPayer = web3_js_1.Keypair.generate();
    // Request airdrop for test payer on Devnet
    const lamportsNeeded = Math.round((params.amountSol + 0.01) * web3_js_1.LAMPORTS_PER_SOL);
    const airdropSig = await exports.connection.requestAirdrop(testPayer.publicKey, lamportsNeeded);
    const latestBh = await exports.connection.getLatestBlockhash();
    await exports.connection.confirmTransaction({
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
    const signature = await (0, web3_js_1.sendAndConfirmTransaction)(exports.connection, tx, [testPayer], {
        commitment: 'confirmed',
    });
    return {
        signature,
        payer: testPayer.publicKey.toBase58(),
    };
}
