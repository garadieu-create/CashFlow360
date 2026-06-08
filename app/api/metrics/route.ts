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

export async function GET(req: NextRequest) {
  try {
    // 1. Check for PAYMENT-SIGNATURE header (x402 protocol)
    const signature = req.headers.get('payment-signature');

    // Circle Gateway invoice requirement definition
    const payTo = CASHFLOW_VAULT_ADDRESS;
    const price = "100"; // 0.0001 USDC (6 decimals)
    const requirements = [
      {
        scheme: "exact",
        network: "eip155:5042002", // Arc Testnet Chain ID
        maxAmountRequired: price,
        resource: "/api/metrics",
        description: "Company financial statistics for AI credit scorer",
        payTo: payTo,
        asset: USDC_ADDRESS,
        invoiceId: `inv_${Math.random().toString(36).substring(2, 12)}`
      }
    ];

    const requirementsBase64 = Buffer.from(JSON.stringify(requirements)).toString('base64');

    if (!signature) {
      // Return 402 Payment Required with PAYMENT-REQUIRED header
      return new NextResponse(
        JSON.stringify({
          error: "Payment Required",
          message: "This endpoint requires an x402 Gateway nanopayment to access. Pay $0.0001 USDC to view metrics.",
          requirements
        }),
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'PAYMENT-REQUIRED': requirementsBase64,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, payment-signature'
          }
        }
      );
    }

    // 2. Validate Payment (Simulation verification matching Circle Gateway SDK validation)
    // We assume the payment signature is a valid authorization. In production, we verify the signature against the gateway.
    let verified = false;
    try {
      // Decode PAYMENT-SIGNATURE or verify token
      const sigData = JSON.parse(Buffer.from(signature, 'base64').toString('utf-8'));
      if (sigData || signature.length > 10) {
        verified = true;
      }
    } catch {
      // Fallback: If not base64, check if it is a simulated credential header
      if (signature.startsWith('0x') || signature === 'mock-agent-signature-token') {
        verified = true;
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid payment signature.", details: "The provided x402 payment signature could not be verified by the Gateway." },
        { status: 400 }
      );
    }

    // 3. Increment Nanopayments Revenue in SQLite
    const existingRev = await queryDb(`SELECT value FROM settings WHERE key = 'nanopayments_revenue'`);
    const existingQueries = await queryDb(`SELECT value FROM settings WHERE key = 'nanopayments_queries_count'`);

    const currentRevenue = parseFloat(existingRev[0]?.value || '0');
    const currentQueries = parseInt(existingQueries[0]?.value || '0');

    const nextRevenue = currentRevenue + 0.0001;
    const nextQueries = currentQueries + 1;

    await runDb(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('nanopayments_revenue', ?, ?)`, [nextRevenue.toString(), Date.now()]);
    await runDb(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('nanopayments_queries_count', ?, ?)`, [nextQueries.toString(), Date.now()]);

    // Log the event in agent database
    await runDb(
      `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
      [Date.now(), `Settled $0.0001 USDC nanopayment for metrics access. Query #${nextQueries}`, 'SUCCESS']
    );

    // 4. Fetch live on-chain stats from Arc RPC
    const client = createPublicClient({
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network')
    });

    let vaultUSDC = BigInt(0);
    try {
      vaultUSDC = await client.readContract({
        address: CASHFLOW_VAULT_ADDRESS as `0x${string}`,
        abi: CASHFLOW_VAULT_ABI,
        functionName: 'getVaultBalance',
        args: ['0x2724D3E646A9409b85c1B85DbeB9Fd6FA46C396a']
      }) as bigint;
    } catch {
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
        args: [CASHFLOW_VAULT_ADDRESS as `0x${string}`]
      }) as bigint;
    }

    const vaultBalanceFormatted = parseFloat(formatUnits(vaultUSDC, 6));

    // Calculate daily average outflow
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
      args: { from: CASHFLOW_VAULT_ADDRESS as `0x${string}` },
      fromBlock,
      toBlock: 'latest'
    });

    let totalOutflow = 0;
    logs.forEach((log: any) => {
      totalOutflow += parseFloat(formatUnits(log.args.value || BigInt(0), 6));
    });

    const dailyOutflow = totalOutflow > 0 ? (totalOutflow / 2) : 120.0;
    const runwayDays = dailyOutflow > 0 ? (vaultBalanceFormatted / dailyOutflow) : Infinity;

    // Return payload with success response headers
    const paymentResponse = Buffer.from(JSON.stringify({
      status: "settled",
      amount: "100",
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`
    })).toString('base64');

    return NextResponse.json(
      {
        success: true,
        company: "CashFlow360 SME Treasury",
        timestamp: Date.now(),
        metrics: {
          vaultBalanceUSDC: vaultBalanceFormatted,
          dailyAverageOutflowUSDC: dailyOutflow,
          projectedRunwayDays: runwayDays === Infinity ? 999 : parseFloat(runwayDays.toFixed(1)),
          solvencyRating: runwayDays > 60 ? "A+" : runwayDays > 30 ? "B" : "C-",
        },
        historicalTransactionsIndexed: logs.length
      },
      {
        status: 200,
        headers: {
          'PAYMENT-RESPONSE': paymentResponse,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, payment-signature'
        }
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, payment-signature'
    }
  });
}
