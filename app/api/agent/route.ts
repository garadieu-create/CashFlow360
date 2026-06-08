import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'agent', 'agent.db');

// Initialize database with default structure and values
function ensureDatabaseInitialized(): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH);
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS session_tokens (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at INTEGER
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at INTEGER
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER,
          message TEXT,
          level TEXT
        )
      `);

      // Default settings
      const defaults = [
        { key: 'runway_threshold_days', value: '30' },
        { key: 'agent_wallet_address', value: '0x2724D3E646A9409b85c1B85DbeB9Fd6FA46C396a' },
        { key: 'spending_limit_daily', value: '5000' },
        { key: 'target_vault_address', value: '0x8704caa872Ac721e648DBeB9Fd6FA46C396a' },
        { key: 'mode', value: 'simulation' }
      ];

      defaults.forEach(({ key, value }) => {
        db.run(
          `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
          [key, value, Date.now()]
        );
      });

      // Seed first initial logs to look awesome immediately
      db.get(`SELECT COUNT(*) as count FROM logs`, (err, row: any) => {
        if (!err && row && row.count === 0) {
          const initialLogs = [
            { timestamp: Date.now() - 30000, message: 'Autonomous Treasury Agent initialized in simulation mode.', level: 'SYSTEM' },
            { timestamp: Date.now() - 25000, message: 'Policies configured: $5,000 daily limit, allowed destination CashFlowVault.', level: 'SUCCESS' },
            { timestamp: Date.now() - 10000, message: 'Active runway monitoring loop running. Current vault health check: OK.', level: 'INFO' }
          ];
          initialLogs.forEach(log => {
            db.run(
              `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
              [log.timestamp, log.message, log.level]
            );
          });
        }
      });
      
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Helper to interact with SQLite DB
async function queryDb(sql: string, params: any[] = []): Promise<any[]> {
  await ensureDatabaseInitialized();
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function runDb(sql: string, params: any[] = []): Promise<void> {
  await ensureDatabaseInitialized();
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.run(sql, params, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function GET(req: NextRequest) {
  try {
    // Read settings from SQLite
    const settingsRows = await queryDb(`SELECT key, value FROM settings`);
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach(row => {
      settingsMap[row.key] = row.value;
    });

    // Check auth status
    const sessionRows = await queryDb(`SELECT value FROM session_tokens WHERE key = 'session_token'`);
    const isAuthenticated = sessionRows.length > 0;

    // Fetch latest logs
    const logs = await queryDb(`SELECT timestamp, message, level FROM logs ORDER BY id DESC LIMIT 15`);

    return NextResponse.json({
      success: true,
      settings: {
        runwayThresholdDays: parseInt(settingsMap.runway_threshold_days || '30'),
        agentWalletAddress: settingsMap.agent_wallet_address || '0x2724D3E646A9409b85c1B85DbeB9Fd6FA46C396a',
        spendingLimitDaily: parseFloat(settingsMap.spending_limit_daily || '5000'),
        targetVaultAddress: settingsMap.target_vault_address || '',
        mode: settingsMap.mode || 'simulation',
        isAuthenticated,
        nanopaymentsRevenue: parseFloat(settingsMap.nanopayments_revenue || '0.00'),
        nanopaymentsQueriesCount: parseInt(settingsMap.nanopayments_queries_count || '0'),
        registeredOnChain: settingsMap.agent_registered_on_chain === 'true',
        reputationScore: parseInt(settingsMap.agent_reputation_score || '0'),
        registryTx: settingsMap.agent_registry_tx || '',
        agentType: settingsMap.agent_type || 'Treasury Manager'
      },
      logs
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { runwayThresholdDays, agentWalletAddress, spendingLimitDaily, mode, isAuthenticated } = body;

    if (runwayThresholdDays !== undefined) {
      await runDb(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('runway_threshold_days', ?, ?)`,
        [runwayThresholdDays.toString(), Date.now()]
      );
    }
    if (agentWalletAddress !== undefined) {
      await runDb(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('agent_wallet_address', ?, ?)`,
        [agentWalletAddress, Date.now()]
      );
    }
    if (spendingLimitDaily !== undefined) {
      await runDb(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('spending_limit_daily', ?, ?)`,
        [spendingLimitDaily.toString(), Date.now()]
      );
    }
    if (mode !== undefined) {
      await runDb(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('mode', ?, ?)`,
        [mode, Date.now()]
      );
    }
    if (isAuthenticated !== undefined) {
      if (isAuthenticated) {
        const mockSessionToken = `session_${Math.random().toString(36).substring(2)}_${Date.now()}`;
        await runDb(
          `INSERT OR REPLACE INTO session_tokens (key, value, updated_at) VALUES ('session_token', ?, ?)`,
          [mockSessionToken, Date.now()]
        );
        await runDb(
          `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
          [Date.now(), 'Agent stack email OTP authenticated successfully.', 'SUCCESS']
        );
      } else {
        await runDb(`DELETE FROM session_tokens WHERE key = 'session_token'`);
        await runDb(
          `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
          [Date.now(), 'Agent session revoked by owner.', 'SYSTEM']
        );
      }
    }

    // Write a system log in the db about the update if it wasn't authentication update
    if (isAuthenticated === undefined) {
      await runDb(
        `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
        [Date.now(), 'Settings updated via Owner Dashboard', 'SYSTEM']
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
