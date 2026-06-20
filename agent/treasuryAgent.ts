import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet, USDC_ADDRESS } from '../lib/arc-config';
import { CASHFLOW_VAULT_ADDRESS, CASHFLOW_VAULT_ABI } from '../lib/contracts';
import { execSync, execFileSync } from 'child_process';

// Load environment variables from .env or .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envFallbackPath = path.join(process.cwd(), '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envFallbackPath)) {
    content = fs.readFileSync(envFallbackPath, 'utf8');
  }
  if (content) {
    content.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !parts[0].startsWith('#')) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        process.env[key] = val;
      }
    });
  }
}
loadEnv();

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
    { key: 'agent_wallet_address', value: '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b' },
    { key: 'spending_limit_daily', value: '5000' },
    { key: 'target_vault_address', value: CASHFLOW_VAULT_ADDRESS },
    { key: 'mode', value: 'live' }, // 'live' or 'simulation'
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

  // Force simulation mode to upgrade to live
  const currentMode = await getSetting('mode');
  if (!currentMode || currentMode === 'simulation') {
    await setSetting('mode', 'live');
    await logToDb('Migrated system mode to: live', 'SYSTEM');
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
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('Invalid email address format.');
  }

  await logToDb(`Initiating email-OTP login for: ${email}`);
  try {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    await logToDb(`Running command: npx circle wallet login ${email} --type agent --init`, 'SYSTEM');
    const initOutput = execFileSync(
      npxCmd,
      ['circle', 'wallet', 'login', email, '--type', 'agent', '--init'],
      { 
        encoding: 'utf8',
        env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' }
      }
    );
    console.log(initOutput);

    // Parse the request ID from the output (UUID format)
    const match = initOutput.match(/--request\s+([a-f0-9\-]{36})/i);
    if (!match || !match[1]) {
      throw new Error(`Could not parse request ID from CLI output:\n${initOutput}`);
    }
    const requestId = match[1];
    await logToDb(`Parsed Request ID: ${requestId}`);

    // Prompt the user in terminal for OTP code
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const otp = await new Promise<string>((resolve) => {
      readline.question('\nEnter the 6-digit OTP code sent to your email (e.g. ABC-123456 or 123456): ', (answer: string) => {
        readline.close();
        resolve(answer.trim());
      });
    });

    const otpRegex = /^[a-zA-Z0-9-]{3,12}$/;
    if (!otp || !otpRegex.test(otp)) {
      throw new Error("OTP code is required and must be in valid format to complete authentication.");
    }

    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!requestId || !uuidRegex.test(requestId)) {
      throw new Error("Invalid Request ID format.");
    }

    await logToDb(`Submitting OTP with command: npx circle wallet login --type agent --request ${requestId} --otp <redacted>`, 'SYSTEM');
    const confirmOutput = execFileSync(
      npxCmd,
      ['circle', 'wallet', 'login', '--type', 'agent', '--request', requestId, '--otp', otp],
      { 
        encoding: 'utf8',
        env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' }
      }
    );
    console.log(confirmOutput);

    // Verify session
    const statusOutput = execFileSync(
      npxCmd,
      ['circle', 'wallet', 'status'],
      { 
        encoding: 'utf8',
        env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' }
      }
    );
    await logToDb(`Circle CLI session verified: ${statusOutput.trim()}`, 'SUCCESS');

    // Save session status
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO session_tokens (key, value, updated_at) VALUES ('session_token', ?, ?)`,
        [`session_active_${Date.now()}`, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  } catch (err: any) {
    await logToDb(`Authentication failed: ${err.message}`, 'ERROR');
    throw err;
  }
}

// Spending Policy Configuration
async function configureSpendingPolicies() {
  const dailyLimit = await getSetting('spending_limit_daily') || '5000';
  const mode = await getSetting('mode');
  const agentAddress = await getSetting('agent_wallet_address') || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b';

  if (mode === 'live') {
    // Spending policies are mainnet-only. Log and skip setting limits on testnet.
    await logToDb(`Spending policies are mainnet-only. Skipping CLI wallet limit command for testnet wallet ${agentAddress}.`, 'INFO');
  }
}

// Fetch balance and daily outflow
async function monitorRunwayAndRebalance() {
  try {
    const thresholdDays = parseInt(await getSetting('runway_threshold_days') || '30');
    const agentAddress = await getSetting('agent_wallet_address') || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b';
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
        args: [agentAddress as `0x${string}`]
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

    // Calculate daily average outflow
    const dailyOutflow = totalOutflow > 0 ? (totalOutflow / 2) : 100.0;

    // Calculate Runway Days
    const runwayDays = dailyOutflow > 0 ? (vaultBalanceFormatted / dailyOutflow) : Infinity;

    await logToDb(`Metrics update: Vault Balance = ${vaultBalanceFormatted.toFixed(2)} USDC | Avg Outflow = ${dailyOutflow.toFixed(2)} USDC/day | Runway = ${runwayDays === Infinity ? 'Infinity' : runwayDays.toFixed(1)} days`);

    // 3. Evaluate Threshold & Bridge if needed
    if (runwayDays < thresholdDays) {
      await logToDb(`Runway (${runwayDays.toFixed(1)} days) is below threshold (${thresholdDays} days). Initiating replenishment.`, 'TRIGGER');

      // Fetch actual Base Sepolia balance of the agent wallet
      let baseSepoliaBalance = 0.0;
      try {
        const { baseSepolia } = await import('viem/chains');
        const baseClient = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org')
        });
        const baseUSDC = await baseClient.readContract({
          address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
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
          args: [agentAddress as `0x${string}`]
        }) as bigint;
        baseSepoliaBalance = parseFloat(formatUnits(baseUSDC, 6));
      } catch (err: any) {
        console.warn(`Failed to fetch real Base Sepolia balance: ${err.message}. Using fallback.`);
        baseSepoliaBalance = 10.0; // fallback minimum
      }
      await logToDb(`Base Sepolia agent wallet has active balance: ${baseSepoliaBalance.toFixed(2)} USDC.`);

      if (baseSepoliaBalance > 0) {
        const bridgeAmount = Math.min(1500, baseSepoliaBalance); // bridge amount up to balance
        const mode = await getSetting('mode');

        if (mode === 'live') {
          const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
          if (!evmAddressRegex.test(targetVault) || !evmAddressRegex.test(agentAddress)) {
            throw new Error('Invalid vault or agent wallet address formats in settings.');
          }
          await logToDb(`Executing CCTP bridge: npx circle bridge transfer ARC-TESTNET ${targetVault} --amount ${bridgeAmount} --address ${agentAddress} --chain BASE-SEPOLIA`, 'EXEC');
          try {
            const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
            execFileSync(
              npxCmd,
              [
                'circle',
                'bridge',
                'transfer',
                'ARC-TESTNET',
                targetVault,
                '--amount',
                bridgeAmount.toString(),
                '--address',
                agentAddress,
                '--chain',
                'BASE-SEPOLIA'
              ],
              { 
                stdio: 'inherit',
                env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' }
              }
            );
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
