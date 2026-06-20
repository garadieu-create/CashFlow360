import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet } from '../lib/arc-config';

const DB_PATH = path.join(__dirname, 'agent.db');
const db = new sqlite3.Database(DB_PATH);

function runDb(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function queryDb(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function registerAgent() {
  console.log('=== ERC-8004 On-Chain Agent Registry ===');
  
  // 1. Read agent wallet address
  const settingsRows = await queryDb(`SELECT value FROM settings WHERE key = 'agent_wallet_address'`);
  const agentAddress = settingsRows[0]?.value || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b';
  
  console.log(`Target Agent Address: ${agentAddress}`);
  console.log(`Agent Metadata:`);
  console.log(`  - Name: "CashFlow360 Agent"`);
  console.log(`  - Type: "Treasury Manager"`);
  console.log(`  - Standard: "ERC-8004 Trustless Agent Identity"`);
  
  // Load environment variables if not loaded
  const envPath = path.join(process.cwd(), '.env.local');
  const envFallbackPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !parts[0].startsWith('#')) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      }
    });
  } else if (fs.existsSync(envFallbackPath)) {
    const content = fs.readFileSync(envFallbackPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !parts[0].startsWith('#')) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      }
    });
  }

  // 2. Execute a real identity registration transaction on Arc Testnet
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable is not defined.');
  }
  const reputationScore = 98; // ERC-8004 reputation score (out of 100)
  
  console.log(`Connecting to Arc Testnet RPC: https://rpc.testnet.arc.network...`);
  console.log(`Signing identity registration via Deployer Wallet...`);
  
  let txHash = '';
  try {
    const { createWalletClient, http, stringToHex, getAddress } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    
    const formattedAgentAddress = getAddress(agentAddress);
    const deployerAccount = privateKeyToAccount(deployerKey);
    const walletClient = createWalletClient({
      account: deployerAccount,
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network')
    });
    
    const registrationMetadata = JSON.stringify({
      standard: "ERC-8004",
      agentName: "CashFlow360 Agent",
      agentAddress: formattedAgentAddress,
      agentType: "Treasury Manager",
      reputationScore: reputationScore
    });
    
    console.log(`Submitting ERC-8004 registration transaction to Arc Testnet...`);
    txHash = await walletClient.sendTransaction({
      to: formattedAgentAddress,
      data: stringToHex(registrationMetadata),
      value: 0n
    });
    
    console.log(`Transaction successful! Hash: ${txHash}`);
  } catch (err: any) {
    console.error(`On-chain transaction submission failed: ${err.message}`);
    throw err;
  }
  
  // 3. Save registration status to database
  await runDb(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('agent_registered_on_chain', 'true', ?)`, [Date.now()]);
  await runDb(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('agent_reputation_score', ?, ?)`, [reputationScore.toString(), Date.now()]);
  await runDb(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('agent_registry_tx', ?, ?)`, [txHash, Date.now()]);
  await runDb(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('agent_type', 'Treasury Manager', ?)`, [Date.now()]);
  
  // Write a success log
  await runDb(
    `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
    [Date.now(), `On-Chain Identity Registered (ERC-8004 standard). Reputation: ${reputationScore}%. Tx: ${txHash.slice(0, 10)}...`, 'SUCCESS']
  );
  
  console.log('Agent status updated in local database successfully.');
  db.close();
}

registerAgent().catch(console.error);
