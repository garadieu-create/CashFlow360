import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arcTestnet, USDC_ADDRESS } from './arc-config';
import { CASHFLOW_VAULT_ADDRESS, CASHFLOW_VAULT_ABI, USDC_ABI } from './contracts';

const DB_PATH = path.join(process.cwd(), 'agent', 'agent.db');

function queryDb(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(DB_PATH)) {
      return resolve([]);
    }
    const db = new sqlite3.Database(DB_PATH);
    db.configure("busyTimeout", 10000);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runDb(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    const db = new sqlite3.Database(DB_PATH);
    db.configure("busyTimeout", 10000);
    db.run(sql, params, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

// Active locks to prevent overlapping seeder calls for the same address
const activeSeeding = new Set<string>();

export async function bootstrapOnChainData(userAddress: string): Promise<boolean> {
  const normalizedUser = userAddress.toLowerCase();

  // If already seeding this user, skip to prevent double seeding
  if (activeSeeding.has(normalizedUser)) {
    return false;
  }

  try {
    activeSeeding.add(normalizedUser);

    // 1. Check if the user already has cached transactions in SQLite
    const hasTxs = await queryDb(
      `SELECT id FROM cached_events WHERE from_address = ? OR to_address = ? LIMIT 1`,
      [normalizedUser, normalizedUser]
    );

    if (hasTxs.length > 0) {
      console.log(`[BOOTSTRAP] User ${userAddress} already has transaction history. Seeding skipped.`);
      return false;
    }

    console.log(`[BOOTSTRAP] Starting on-chain seeding for user ${userAddress}...`);

    // Load deployer key (default to the prefunded testnet wallet)
    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY || '0x920df0748032d4d324be4e2171414365661733c008a67d05edc43001aa67ff13';
    const deployerAccount = privateKeyToAccount(deployerKey as `0x${string}`);

    const client = createPublicClient({
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network')
    });

    const walletClient = createWalletClient({
      account: deployerAccount,
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network')
    });

    // Check deployer native/USDC balance first
    const usdcBal = await client.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [deployerAccount.address]
    }) as bigint;

    if (usdcBal < 50000n) {
      console.warn(`[BOOTSTRAP] Deployer balance is too low (${usdcBal} units). Cannot seed transactions.`);
      return false;
    }

    // Step 1: Transfer 0.005 USDC directly to the user's smart account (to fund ERC-20 operations)
    console.log(`[BOOTSTRAP] Transferring 0.005 USDC to ${userAddress}...`);
    const transferTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [normalizedUser as `0x${string}`, 5000n]
    });
    console.log(`[BOOTSTRAP] Direct transfer transaction: ${transferTx}`);

    // Step 2: Approve the vault to spend deployer's USDC if needed
    console.log(`[BOOTSTRAP] Approving vault to spend deployer USDC...`);
    const approveTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CASHFLOW_VAULT_ADDRESS, 100000n]
    });
    console.log(`[BOOTSTRAP] Approve transaction: ${approveTx}`);

    // Wait short delay for block confirmation
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: Deposit 0.02 USDC into the vault from the deployer's wallet
    console.log(`[BOOTSTRAP] Depositing 0.02 USDC to vault...`);
    const depositTx = await walletClient.writeContract({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'deposit',
      args: [20000n]
    });
    console.log(`[BOOTSTRAP] Vault deposit transaction: ${depositTx}`);

    await new Promise(r => setTimeout(r, 1000));

    // Step 4: Perform categorized vault transfers from deployer to user
    const transfersList = [
      { amount: 5000n, category: 'Invoicing' },
      { amount: 8000n, category: 'Payroll' },
      { amount: 3000n, category: 'Consulting Services' }
    ];

    for (const txInfo of transfersList) {
      console.log(`[BOOTSTRAP] Vault transferring ${txInfo.amount} USDC (Category: ${txInfo.category}) to ${userAddress}...`);
      const vaultTx = await walletClient.writeContract({
        address: CASHFLOW_VAULT_ADDRESS,
        abi: CASHFLOW_VAULT_ABI,
        functionName: 'transfer',
        args: [normalizedUser as `0x${string}`, txInfo.amount, txInfo.category]
      });
      console.log(`[BOOTSTRAP] Vault transfer transaction: ${vaultTx}`);
      await new Promise(r => setTimeout(r, 800));
    }

    console.log(`[BOOTSTRAP] Successfully seeded real transactions on-chain for ${userAddress}!`);

    // Log the successful seed events to DB settings so we don't repeat this
    const timestamp = Date.now();
    await runDb(
      `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
      [timestamp, `Real on-chain transaction history successfully bootstrapped for account ${userAddress}`, 'SUCCESS']
    );

    return true;
  } catch (err: any) {
    console.error(`[BOOTSTRAP] Error during on-chain seeding for user ${userAddress}:`, err.message);
    return false;
  } finally {
    activeSeeding.delete(normalizedUser);
  }
}

export async function seedLocalCacheFallback(userAddress: string): Promise<void> {
  const normalizedUser = userAddress.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  
  // Check if already seeded to prevent duplicate inserts
  const existing = await queryDb(
    `SELECT id FROM cached_events WHERE from_address = ? OR to_address = ? LIMIT 1`,
    [normalizedUser, normalizedUser]
  );
  if (existing.length > 0) return;

  console.log(`[SEEDER] Seeding local cache fallback for ${userAddress}`);
  
  const mockTxs = [
    {
      id: `mock_seed_1_${normalizedUser}`,
      type: 'Deposited',
      from: normalizedUser,
      to: CASHFLOW_VAULT_ADDRESS,
      amount: '40.00',
      category: 'Deposit',
      timestamp: now - 3600 * 24 * 5, // 5 days ago
      hash: `0xmock${Math.random().toString(16).substring(2, 62)}`
    },
    {
      id: `mock_seed_2_${normalizedUser}`,
      type: 'Transferred',
      from: CASHFLOW_VAULT_ADDRESS,
      to: normalizedUser,
      amount: '125.00',
      category: 'Invoicing',
      timestamp: now - 3600 * 24 * 3, // 3 days ago
      hash: `0xmock${Math.random().toString(16).substring(2, 62)}`
    },
    {
      id: `mock_seed_3_${normalizedUser}`,
      type: 'Transferred',
      from: CASHFLOW_VAULT_ADDRESS,
      to: normalizedUser,
      amount: '85.00',
      category: 'Payroll',
      timestamp: now - 3600 * 24 * 2, // 2 days ago
      hash: `0xmock${Math.random().toString(16).substring(2, 62)}`
    },
    {
      id: `mock_seed_4_${normalizedUser}`,
      type: 'Transferred',
      from: normalizedUser,
      to: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
      amount: '45.00',
      category: 'Consulting Services',
      timestamp: now - 3600 * 12, // 12 hours ago
      hash: `0xmock${Math.random().toString(16).substring(2, 62)}`
    }
  ];

  for (const t of mockTxs) {
    await runDb(
      `INSERT OR IGNORE INTO cached_events (id, event_type, from_address, to_address, amount, category, timestamp, tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.type, t.from, t.to, t.amount, t.category, t.timestamp, t.hash]
    );
  }

  // Add initial log
  await runDb(
    `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
    [Date.now(), `Local cache transaction history seeded for account ${userAddress}`, 'INFO']
  );
}
