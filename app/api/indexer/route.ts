import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet, USDC_ADDRESS } from '../../../lib/arc-config';
import { CASHFLOW_VAULT_ADDRESS, CASHFLOW_VAULT_ABI } from '../../../lib/contracts';

const DB_PATH = path.join(process.cwd(), 'agent', 'agent.db');

function runDb(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    const db = new sqlite3.Database(DB_PATH);
    db.run(sql, params, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

function queryDb(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(DB_PATH)) {
      return resolve([]);
    }
    const db = new sqlite3.Database(DB_PATH);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Ensure indexer cache tables exist in the shared database
async function ensureTables() {
  await runDb(`
    CREATE TABLE IF NOT EXISTS cached_events (
      id TEXT PRIMARY KEY,
      event_type TEXT,
      from_address TEXT,
      to_address TEXT,
      amount TEXT,
      category TEXT,
      timestamp INTEGER,
      tx_hash TEXT
    )
  `);

  await runDb(`
    CREATE TABLE IF NOT EXISTS indexer_state (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

function generateSimulatedTransactions(userAddress: string) {
  const user = userAddress.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const partners = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Customer A
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Customer B
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Supplier A
    '0x15d34AAf54a67C681F2F2B412493922c01d9f82e', // Contractor A
    '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // SaaS Provider
    '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720', // Gas station
  ];

  const txTemplates = [
    { type: 'inflow', partner: partners[0], category: 'Customer Invoice', baseAmount: 2400 },
    { type: 'inflow', partner: partners[1], category: 'Customer Invoice', baseAmount: 1850 },
    { type: 'outflow', partner: partners[2], category: 'Hosting Fees', baseAmount: 350 },
    { type: 'outflow', partner: partners[3], category: 'Contractor Payment', baseAmount: 1200 },
    { type: 'outflow', partner: partners[4], category: 'Software Licenses', baseAmount: 89 },
    { type: 'inflow', partner: partners[0], category: 'Customer Invoice', baseAmount: 3200 },
    { type: 'outflow', partner: partners[5], category: 'Gas Rebalance', baseAmount: 45 },
    { type: 'inflow', partner: partners[1], category: 'SaaS Licensing', baseAmount: 950 },
  ];

  const deposits: any[] = [];
  const withdrawals: any[] = [];
  const transfers: any[] = [];

  for (let i = 35; i >= 1; i--) {
    const template = txTemplates[i % txTemplates.length];
    const timestamp = now - i * 20 * 3600 - Math.floor(Math.random() * 8 * 3600);
    const variance = 1 + (Math.random() * 0.3 - 0.15);
    const amount = (template.baseAmount * variance).toFixed(2);
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    transfers.push({
      id: `sim_tx_${i}`,
      from: template.type === 'inflow' ? template.partner : user,
      to: template.type === 'inflow' ? user : template.partner,
      amount,
      category: template.category,
      timestamp,
      txHash,
      isSimulated: true
    });
  }

  // Vault deposits & withdrawals
  const vaultTxTemplates = [
    { type: 'deposit', amount: 5000, category: 'Vault Deposit' },
    { type: 'withdrawal', amount: 1500, category: 'Vault Withdrawal' },
    { type: 'deposit', amount: 8000, category: 'Vault Deposit' },
  ];

  vaultTxTemplates.forEach((v, index) => {
    const timestamp = now - (15 - index * 5) * 24 * 3600;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    if (v.type === 'deposit') {
      deposits.push({
        id: `sim_v_dep_${index}`,
        from: user,
        amount: v.amount.toFixed(2),
        timestamp,
        txHash,
        isSimulated: true
      });
    } else {
      withdrawals.push({
        id: `sim_v_wth_${index}`,
        to: user,
        amount: v.amount.toFixed(2),
        timestamp,
        txHash,
        isSimulated: true
      });
    }
  });

  return { deposits, withdrawals, transfers };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || '';
    
    const url = new URL(req.url);
    const userAddress = url.searchParams.get('address')?.toLowerCase();

    await ensureTables();

    // 1. Check if cache is stale (older than 10 seconds)
    const lastUpdateRow = await queryDb(`SELECT value FROM indexer_state WHERE key = 'last_update'`);
    const lastUpdate = parseInt(lastUpdateRow[0]?.value || '0');
    const now = Date.now();

    const client = createPublicClient({
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network')
    });

    if (now - lastUpdate > 10000) {
      // Fetch latest logs from Arc RPC to update indexer cache
      const currentBlock = await client.getBlockNumber();
      const lastIndexedBlockRow = await queryDb(`SELECT value FROM indexer_state WHERE key = 'last_indexed_block'`);
      const startBlock = BigInt(lastIndexedBlockRow[0]?.value || '0');
      
      // Look back at most 2000 blocks or starting block
      const fromBlock = currentBlock - startBlock > BigInt(2000) ? currentBlock - BigInt(2000) : startBlock;

      try {
        // Fetch Transferred events
        const transferredLogs = await client.getLogs({
          address: CASHFLOW_VAULT_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'Transferred',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256', indexed: false },
              { name: 'category', type: 'string', indexed: false },
              { name: 'timestamp', type: 'uint256', indexed: false }
            ]
          },
          fromBlock,
          toBlock: 'latest'
        });

        for (const log of transferredLogs) {
          const args = log.args as any;
          const id = `${log.transactionHash}_${log.logIndex}`;
          await runDb(
            `INSERT OR IGNORE INTO cached_events (id, event_type, from_address, to_address, amount, category, timestamp, tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 
              'Transferred', 
              args.from, 
              args.to, 
              formatUnits(args.amount || BigInt(0), 6), 
              args.category || 'Uncategorized', 
              Number(args.timestamp || BigInt(0)), 
              log.transactionHash
            ]
          );
        }

        // Fetch Deposited events
        const depositedLogs = await client.getLogs({
          address: CASHFLOW_VAULT_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'Deposited',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256', indexed: false },
              { name: 'timestamp', type: 'uint256', indexed: false }
            ]
          },
          fromBlock,
          toBlock: 'latest'
        });

        for (const log of depositedLogs) {
          const args = log.args as any;
          const id = `${log.transactionHash}_${log.logIndex}`;
          await runDb(
            `INSERT OR IGNORE INTO cached_events (id, event_type, from_address, to_address, amount, category, timestamp, tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 
              'Deposited', 
              args.from, 
              CASHFLOW_VAULT_ADDRESS, 
              formatUnits(args.amount || BigInt(0), 6), 
              'Deposit', 
              Number(args.timestamp || BigInt(0)), 
              log.transactionHash
            ]
          );
        }

        // Fetch Withdrawn events
        const withdrawnLogs = await client.getLogs({
          address: CASHFLOW_VAULT_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'Withdrawn',
            inputs: [
              { name: 'to', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256', indexed: false },
              { name: 'timestamp', type: 'uint256', indexed: false }
            ]
          },
          fromBlock,
          toBlock: 'latest'
        });

        for (const log of withdrawnLogs) {
          const args = log.args as any;
          const id = `${log.transactionHash}_${log.logIndex}`;
          await runDb(
            `INSERT OR IGNORE INTO cached_events (id, event_type, from_address, to_address, amount, category, timestamp, tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 
              'Withdrawn', 
              CASHFLOW_VAULT_ADDRESS, 
              args.to, 
              formatUnits(args.amount || BigInt(0), 6), 
              'Withdrawal', 
              Number(args.timestamp || BigInt(0)), 
              log.transactionHash
            ]
          );
        }

        // Update indexer state
        await runDb(`INSERT OR REPLACE INTO indexer_state (key, value) VALUES ('last_update', ?)`, [now.toString()]);
        await runDb(`INSERT OR REPLACE INTO indexer_state (key, value) VALUES ('last_indexed_block', ?)`, [currentBlock.toString()]);
      } catch (err) {
        console.error("RPC fetch error:", err);
      }
    }

    // 2. Fetch cache records from SQLite
    const cachedRows = await queryDb(`SELECT * FROM cached_events ORDER BY timestamp DESC`);

    // Parse and group rows
    const deposits = cachedRows
      .filter(row => row.event_type === 'Deposited')
      .map(row => ({
        id: row.id,
        from: row.from_address,
        amount: row.amount,
        timestamp: row.timestamp,
        txHash: row.tx_hash
      }));

    const withdrawals = cachedRows
      .filter(row => row.event_type === 'Withdrawn')
      .map(row => ({
        id: row.id,
        to: row.to_address,
        amount: row.amount,
        timestamp: row.timestamp,
        txHash: row.tx_hash
      }));

    const transfers = cachedRows
      .filter(row => row.event_type === 'Transferred')
      .map(row => ({
        id: row.id,
        from: row.from_address,
        to: row.to_address,
        amount: row.amount,
        category: row.category,
        timestamp: row.timestamp,
        txHash: row.tx_hash
      }));

    let isDemoMode = false;
    let finalDeposits = deposits;
    let finalWithdrawals = withdrawals;
    let finalTransfers = transfers;

    if (userAddress) {
      const hasUserTxs = cachedRows.some(row => 
        row.from_address?.toLowerCase() === userAddress || 
        row.to_address?.toLowerCase() === userAddress
      );
      if (!hasUserTxs) {
        isDemoMode = true;
        const sim = generateSimulatedTransactions(userAddress);
        finalDeposits = sim.deposits;
        finalWithdrawals = sim.withdrawals;
        finalTransfers = sim.transfers;
      }
    } else if (cachedRows.length === 0) {
      isDemoMode = true;
      const sim = generateSimulatedTransactions('0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b');
      finalDeposits = sim.deposits;
      finalWithdrawals = sim.withdrawals;
      finalTransfers = sim.transfers;
    }

    // Simple GraphQL-style resolver mapping
    const data: Record<string, any> = {};
    if (query.includes('deposits')) {
      data.deposits = finalDeposits;
    }
    if (query.includes('withdrawals')) {
      data.withdrawals = finalWithdrawals;
    }
    if (query.includes('transfers') || query === '') {
      data.transfers = finalTransfers;
    }

    // Fallback if query requests everything
    if (Object.keys(data).length === 0) {
      data.deposits = finalDeposits;
      data.withdrawals = finalWithdrawals;
      data.transfers = finalTransfers;
    }

    return NextResponse.json({
      data,
      indexerStatus: {
        network: "arc-testnet",
        syncState: "synced",
        lastUpdate,
        eventsCount: cachedRows.length,
        isDemoMode
      }
    });

  } catch (err: any) {
    return NextResponse.json({ errors: [{ message: err.message }] }, { status: 500 });
  }
}
