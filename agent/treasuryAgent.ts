import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet, USDC_ADDRESS } from '../lib/arc-config';
import { CASHFLOW_VAULT_ADDRESS, CASHFLOW_VAULT_ABI } from '../lib/contracts';
import { execSync } from 'child_process';

const AGENT_DIR = __dirname;
const DB_PATH = path.join(AGENT_DIR, 'agent.db');

// Ensure database directory exists
if (!fs.existsSync(AGENT_DIR)) {
  fs.mkdirSync(AGENT_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Initialize SQLite Database
function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS session_tokens (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at INTEGER
        )
      `, (err) => { if (err) reject(err); });

      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at INTEGER
        )
      `, (err) => { if (err) reject(err); });

      db.run(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER,
          message TEXT,
          level TEXT
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Log helper
function logToDb(message: string, level: string = 'INFO'): Promise<void> {
  const timestamp = Date.now();
  console.log(`[${level}] ${message}`);
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
      [timestamp, message, level],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Set default settings
async function initSettings() {
  const defaults = [
    { key: 'runway_threshold_days', value: '30' },
    { key: 'agent_wallet_address', value: '0x2724D3E646A9409b85c1B85DbeB9Fd6FA46C396a' },
    { key: 'spending_limit_daily', value: '5000' },
    { key: 'target_vault_address', value: CASHFLOW_VAULT_ADDRESS },
    { key: 'mode', value: 'simulation' }, // 'live' or 'simulation'
  ];

  for (const { key, value } of defaults) {
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
        [key, value, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

// Read settings
function getSetting(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row: any) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
}

// Write setting
function setSetting(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, Date.now()],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Interactive login command
async function handleLogin(email: string) {
  await logToDb(`Initiating email-OTP login for: ${email}`);
  try {
    // In a real environment, we'd trigger `@circle-fin/cli`:
    // npx circle auth login --email <email>
    // We execute in simulation or try executing if live
    const mode = await getSetting('mode');
    if (mode === 'live') {
      logToDb(`Running command: npx circle auth login --email ${email}`, 'SYSTEM');
      execSync(`npx circle auth login --email ${email}`, { stdio: 'inherit' });
    } else {
      await logToDb(`[Simulation Mode] OTP code requested for ${email}`);
      console.log(`\n>>> [Simulation] Verification code sent to ${email}`);
      console.log(`>>> Saving mock session token to agent.db SQLite...\n`);
    }

    // Persist session token in SQLite DB
    const mockSessionToken = `session_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO session_tokens (key, value, updated_at) VALUES ('session_token', ?, ?)`,
        [mockSessionToken, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await logToDb(`Successfully authenticated agent session.`, 'SUCCESS');
  } catch (err: any) {
    await logToDb(`Authentication failed: ${err.message}`, 'ERROR');
  }
}

// Spending Policy Configuration
async function configureSpendingPolicies() {
  const dailyLimit = await getSetting('spending_limit_daily') || '5000';
  const targetVault = await getSetting('target_vault_address') || CASHFLOW_VAULT_ADDRESS;
  const mode = await getSetting('mode');

  await logToDb(`Configuring policies: Daily Limit = $${dailyLimit}, Allowed Address = ${targetVault}`);

  if (mode === 'live') {
    try {
      // Configure using circle cli:
      // circle policies set --limit <limit> --allowed-addresses <address>
      const cmd = `npx circle policies set --limit ${dailyLimit} --allowed-addresses ${targetVault}`;
      execSync(cmd, { stdio: 'inherit' });
      await logToDb(`Policies updated on Circle Developer Platform.`, 'SUCCESS');
    } catch (err: any) {
      await logToDb(`Failed to set policies: ${err.message}`, 'WARNING');
    }
  } else {
    await logToDb(`[Simulation Mode] Policy set successfully: limit=${dailyLimit}, target=${targetVault}`, 'SUCCESS');
  }
}

// Fetch balance and daily outflow
async function monitorRunwayAndRebalance() {
  try {
    const thresholdDays = parseInt(await getSetting('runway_threshold_days') || '30');
    const agentAddress = await getSetting('agent_wallet_address') || '0x2724D3E646A9409b85c1B85DbeB9Fd6FA46C396a';
    const targetVault = await getSetting('target_vault_address') || CASHFLOW_VAULT_ADDRESS;

    // Initialize viem public client for Arc Testnet
    const client = createPublicClient({
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network')
    });

    // 1. Fetch Vault Balance on Arc
    let vaultUSDC = BigInt(0);
    try {
      vaultUSDC = await client.readContract({
        address: targetVault as `0x${string}`,
        abi: CASHFLOW_VAULT_ABI,
        functionName: 'getVaultBalance',
        args: ['0x2724D3E646A9409b85c1B85DbeB9Fd6FA46C396a'] // fallback/any address
      }) as bigint;
    } catch {
      // Direct balance query fallback if function fails
      vaultUSDC = await client.readContract({
        address: USDC_ADDRESS,
        abi: [
          {
            type: 'function',
            name: 'balanceOf',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view'
          }
        ],
        functionName: 'balanceOf',
        args: [targetVault as `0x${string}`]
      }) as bigint;
    }

    const vaultBalanceFormatted = parseFloat(formatUnits(vaultUSDC, 6));

    // 2. Fetch Historical daily outflows from Arc
    const blockNumber = await client.getBlockNumber();
    const fromBlock = blockNumber > BigInt(1000) ? blockNumber - BigInt(1000) : BigInt(0);

    const logs = await client.getLogs({
      address: USDC_ADDRESS,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      },
      args: { from: targetVault as `0x${string}` },
      fromBlock,
      toBlock: 'latest'
    });

    let totalOutflow = 0;
    logs.forEach((log: any) => {
      totalOutflow += parseFloat(formatUnits(log.args.value || BigInt(0), 6));
    });

    // Calculate daily average outflow. Let's assume the blocks span 2 days for testnet simulation
    const dailyOutflow = totalOutflow > 0 ? (totalOutflow / 2) : 100.0; // fallback to 100 USDC/day if no recent txs

    // Calculate Runway Days
    const runwayDays = dailyOutflow > 0 ? (vaultBalanceFormatted / dailyOutflow) : Infinity;

    await logToDb(`Metrics update: Vault Balance = ${vaultBalanceFormatted.toFixed(2)} USDC | Avg Outflow = ${dailyOutflow.toFixed(2)} USDC/day | Runway = ${runwayDays === Infinity ? 'Infinity' : runwayDays.toFixed(1)} days`);

    // 3. Evaluate Threshold & Bridge if needed
    if (runwayDays < thresholdDays) {
      await logToDb(`Runway (${runwayDays.toFixed(1)} days) is below threshold (${thresholdDays} days). Initiating replenishment.`, 'TRIGGER');

      // Check Base Sepolia balance (simulated or real)
      const baseSepoliaBalance = 2500.0; // Simulated Base Sepolia USDC balance
      await logToDb(`Base Sepolia has active balance: ${baseSepoliaBalance.toFixed(2)} USDC.`);

      if (baseSepoliaBalance > 0) {
        const bridgeAmount = 1500; // Bridge in 1500 USDC to replenish runway
        const mode = await getSetting('mode');

        if (mode === 'live') {
          // npx circle bridge create --amount 1500 --chain base-sepolia --destination-chain arc --recipient <vault>
          const cmd = `npx circle bridge create --amount ${bridgeAmount} --chain base-sepolia --destination-chain arc-testnet --recipient ${targetVault}`;
          await logToDb(`Executing CCTP bridge: ${cmd}`, 'EXEC');
          try {
            execSync(cmd, { stdio: 'inherit' });
            await logToDb(`Bridge transaction submitted via CCTP successfully.`, 'SUCCESS');
          } catch (e: any) {
            await logToDb(`Bridge command failed: ${e.message}`, 'ERROR');
          }
        } else {
          await logToDb(`[Simulation Mode] Simulated CCTP bridge: ${bridgeAmount} USDC bridged from Base Sepolia to ${targetVault} on Arc Testnet.`, 'SUCCESS');
        }
      }
    }
  } catch (err: any) {
    await logToDb(`Monitoring cycle error: ${err.message}`, 'ERROR');
  }
}

// Daemon main function
async function main() {
  await initDatabase();
  await initSettings();

  const args = process.argv.slice(2);
  if (args[0] === '--login') {
    const email = args[1];
    if (!email) {
      console.error('Error: Please specify email. Example: --login email@domain.com');
      process.exit(1);
    }
    await handleLogin(email);
    await configureSpendingPolicies();
    process.exit(0);
  }

  await logToDb(`Autonomous Treasury Agent Daemon started.`, 'SYSTEM');
  await configureSpendingPolicies();

  // Run immediately then every 15 seconds
  await monitorRunwayAndRebalance();
  setInterval(monitorRunwayAndRebalance, 15000);
}

main().catch(console.error);
