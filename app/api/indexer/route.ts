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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || '';

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

    // Simple GraphQL-style resolver mapping
    const data: Record<string, any> = {};
    if (query.includes('deposits')) {
      data.deposits = deposits;
    }
    if (query.includes('withdrawals')) {
      data.withdrawals = withdrawals;
    }
    if (query.includes('transfers') || query === '') {
      data.transfers = transfers;
    }

    // Fallback if query requests everything
    if (Object.keys(data).length === 0) {
      data.deposits = deposits;
      data.withdrawals = withdrawals;
      data.transfers = transfers;
    }

    return NextResponse.json({
      data,
      indexerStatus: {
        network: "arc-testnet",
        syncState: "synced",
        lastUpdate,
        eventsCount: cachedRows.length
      }
    });

  } catch (err: any) {
    return NextResponse.json({ errors: [{ message: err.message }] }, { status: 500 });
  }
}
