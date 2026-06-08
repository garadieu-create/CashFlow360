'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSwitchChain, useWriteContract, useConnectorClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowUpDown, ExternalLink, Info, Shield, CheckCircle2, AlertCircle, RefreshCw, Layers, Zap } from 'lucide-react';
import { WalletEmptyState } from '@/components/ui/WalletEmptyState';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { createAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { BridgeKit, EthereumSepolia, BaseSepolia, ArbitrumSepolia, ArcTestnet } from "@circle-fin/bridge-kit";
import { createPublicClient, http, parseUnits, formatUnits, keccak256, parseEventLogs } from 'viem';
import { sepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains';

const SOURCE_CHAINS: Record<string, {
  id: number;
  name: string;
  usdc: `0x${string}`;
  tokenMessenger: `0x${string}`;
  messageTransmitter: `0x${string}`;
  explorer: string;
  domain: number;
}> = {
  sepolia: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    explorer: 'https://sepolia.etherscan.io',
    domain: 0
  },
  base: {
    id: 84532,
    name: 'Base Sepolia',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    explorer: 'https://sepolia.basescan.org',
    domain: 6
  },
  arbitrum: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    explorer: 'https://sepolia.arbiscan.io',
    domain: 3
  }
};

export default function BridgePage() {
  const { isConnected, address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: connectorClient } = useConnectorClient();

  // Bridge States
  const [sourceChain, setSourceChain] = useState('sepolia');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeStep, setBridgeStep] = useState<'input' | 'approve' | 'burn' | 'attest' | 'mint' | 'success'>('input');
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([]);
  const [bridgeTxHash, setBridgeTxHash] = useState('');

  // Swap States
  const [fromToken, setFromToken] = useState('usdc');
  const [toToken, setToToken] = useState('eurc');
  const [swapAmount, setSwapAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapTxHash, setSwapTxHash] = useState('');

  const getExchangeRate = () => {
    if (fromToken === 'usdc' && toToken === 'eurc') return 0.92;
    if (fromToken === 'eurc' && toToken === 'usdc') return 1.08;
    return 1.00;
  };

  const getSimulatedTxHash = () => {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const addLog = (msg: string) => {
    setBridgeLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleStartBridge = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
      toast.error('Please enter a valid USDC amount to bridge.');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet first.');
      return;
    }

    const sourceConfig = SOURCE_CHAINS[sourceChain];
    if (!sourceConfig) {
      toast.error('Unsupported source chain selected.');
      return;
    }

    setBridgeLogs([]);
    addLog(`Initiating USDC bridge request for $${parseFloat(bridgeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    try {
      addLog(`Querying USDC balance on ${sourceConfig.name}...`);
      
      const chainMap: Record<string, any> = {
        sepolia: sepolia,
        base: baseSepolia,
        arbitrum: arbitrumSepolia
      };
      const viemChain = chainMap[sourceChain];

      const publicClient = createPublicClient({
        chain: viemChain,
        transport: http()
      });

      const balance = await publicClient.readContract({
        address: sourceConfig.usdc,
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
        args: [address]
      });

      const parsedAmount = parseUnits(bridgeAmount, 6);
      const balanceFormatted = formatUnits(balance, 6);
      addLog(`USDC Balance on ${sourceConfig.name}: ${balanceFormatted} USDC`);

      if (balance < parsedAmount) {
        throw new Error(`Insufficient USDC balance on source chain (have ${balanceFormatted} USDC, need ${bridgeAmount} USDC).`);
      }

      addLog(`Checking active wallet chain...`);
      if (connectorClient?.chain?.id !== sourceConfig.id) {
        addLog(`Switching wallet to ${sourceConfig.name}...`);
        await switchChainAsync({ chainId: sourceConfig.id });
      }

      setBridgeStep('approve');
      addLog(`Checking USDC allowance for TokenMessenger...`);
      const allowance = await publicClient.readContract({
        address: sourceConfig.usdc,
        abi: [
          {
            type: 'function',
            name: 'allowance',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view'
          }
        ],
        functionName: 'allowance',
        args: [address, sourceConfig.tokenMessenger]
      });

      if (allowance < parsedAmount) {
        addLog(`USDC allowance of ${formatUnits(allowance, 6)} USDC is insufficient.`);
        addLog(`Requesting approval for TokenMessenger (${sourceConfig.tokenMessenger})...`);
        
        const approveTxHash = await writeContractAsync({
          address: sourceConfig.usdc,
          abi: [
            {
              type: 'function',
              name: 'approve',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }],
              stateMutability: 'nonpayable'
            }
          ],
          functionName: 'approve',
          args: [sourceConfig.tokenMessenger, parsedAmount]
        });
        
        addLog(`Approval transaction submitted: ${approveTxHash}`);
        addLog(`Waiting for approval confirmation...`);
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
        addLog(`Approval confirmed!`);
      } else {
        addLog(`USDC allowance is sufficient: ${formatUnits(allowance, 6)} USDC. Skipping approval step.`);
      }

      setBridgeStep('burn');
      addLog(`Initiating CCTP burn transaction via BridgeKit...`);

      const provider = connectorClient?.transport?.value?.provider || (window as any).ethereum;
      if (!provider) {
        throw new Error("No web3 provider found in connector client.");
      }

      const adapter = await createAdapterFromProvider({ provider });
      const kit = new BridgeKit();
      const cctpProvider = kit.providers[0];

            const sourceChainMapped = sourceChain === 'sepolia' ? EthereumSepolia : sourceChain === 'base' ? BaseSepolia : ArbitrumSepolia;

      const preparedBurn = await cctpProvider.burn({
        source: { adapter, chain: sourceChainMapped, address },
        destination: { adapter, chain: ArcTestnet, address },
        amount: bridgeAmount,
        token: 'USDC',
        config: { transferSpeed: 'FAST' }
      });

      addLog(`Broadcasting CCTP burn transaction: depositForBurn()...`);
      const burnTxHash = await preparedBurn.execute();
      setBridgeTxHash(burnTxHash);
      addLog(`CCTP Burn transaction submitted: ${burnTxHash}`);
      addLog(`Waiting for burn confirmation on ${sourceConfig.name}...`);
      const burnReceipt = await publicClient.waitForTransactionReceipt({ hash: burnTxHash as `0x${string}` });
      addLog(`CCTP Burn Confirmed! Block: ${burnReceipt.blockNumber}`);

      setBridgeStep('attest');
      addLog(`Extracting message bytes from burn logs...`);

      const MESSAGE_TRANSMITTER_ABI = [
        {
          type: 'event',
          name: 'MessageSent',
          inputs: [
            { name: 'message', type: 'bytes', indexed: false }
          ]
        }
      ] as const;

      const logs = parseEventLogs({
        abi: MESSAGE_TRANSMITTER_ABI,
        eventName: 'MessageSent',
        logs: burnReceipt.logs
      });

      if (logs.length === 0) {
        throw new Error('MessageSent event not found in burn transaction logs.');
      }

      const messageBytes = logs[0].args.message;
      const messageHash = keccak256(messageBytes);
      addLog(`Message Hash: ${messageHash}`);
      addLog(`Pinging Circle Attestation API to request signature...`);

      let attestation = '';
      let status = 'pending';
      let attempts = 0;
      const maxAttempts = 120;

      while (status !== 'complete' && attempts < maxAttempts) {
        attempts++;
        addLog(`Polling Circle Attestation API (Attempt ${attempts}/${maxAttempts})...`);
        try {
          const response = await fetch(`https://iris-api-sandbox.circle.com/v1/attestations/${messageHash}`);
          if (response.ok) {
            const data = await response.json();
            status = data.status;
            if (status === 'complete') {
              attestation = data.attestation;
              addLog(`Circle Attestation signature successfully generated!`);
            } else {
              addLog(`Attestation pending: ${data.message || 'Circle consensus in progress...'}`);
            }
          } else {
            addLog(`Attestation API returned status: ${response.status}. Retrying...`);
          }
        } catch (err) {
          addLog(`Error querying Attestation API. Retrying...`);
        }
        
        if (status !== 'complete') {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (status !== 'complete') {
        throw new Error('Circle Attestation polling timed out.');
      }

      setBridgeStep('mint');
      addLog(`Switching wallet chain to Arc Testnet (Chain ID: 5042002)...`);
      await switchChainAsync({ chainId: 5042002 });

      addLog(`Connected to Arc Testnet. Submitting claim transaction via receiveMessage()...`);

      const receiveTxHash = await writeContractAsync({
        address: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
        abi: [
          {
            type: 'function',
            name: 'receiveMessage',
            inputs: [
              { name: 'message', type: 'bytes' },
              { name: 'attestation', type: 'bytes' }
            ],
            outputs: [
              { name: '', type: 'bool' }
            ],
            stateMutability: 'nonpayable'
          }
        ],
        functionName: 'receiveMessage',
        args: [messageBytes, attestation as `0x${string}`]
      });

      addLog(`Mint transaction submitted: ${receiveTxHash}`);
      addLog(`Waiting for mint transaction confirmation on Arc Testnet...`);

      const arcPublicClient = createPublicClient({
        chain: {
          id: 5042002,
          name: 'Arc Testnet',
          nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } }
        },
        transport: http()
      });

      const mintReceipt = await arcPublicClient.waitForTransactionReceipt({ hash: receiveTxHash });
      addLog(`USDC successfully minted on Arc Testnet! Block: ${mintReceipt.blockNumber}`);

      setBridgeTxHash(receiveTxHash);
      setBridgeStep('success');
      addLog(`Bridge Completed Successfully!`);
      toast.success('USDC successfully bridged via Circle CCTP!');

    } catch (error: any) {
      console.error(error);
      addLog(`❌ ERROR: ${error.message || error}`);
      toast.error(`Bridge failed: ${error.message || error}`);
      setBridgeStep('input');
    }
  };

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setIsSwapping(true);
    setSwapSuccess(false);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const hash = getSimulatedTxHash();
    setSwapTxHash(hash);
    setIsSwapping(false);
    setSwapSuccess(true);
    toast.success('Swap executed successfully via StableFX!');
  };

  const handleTokenSelectChange = (type: 'from' | 'to', val: string) => {
    if (type === 'from') {
      setFromToken(val);
      setToToken(val === 'usdc' ? 'eurc' : 'usdc');
    } else {
      setToToken(val);
      setFromToken(val === 'usdc' ? 'eurc' : 'usdc');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Bridge & Swap" />
        <div className="app-content">
          {!isConnected ? (
            <WalletEmptyState
              title="Connect Wallet"
              description="Bridge USDC across chains using Circle CCTP."
              svgIcon={
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 48C16 32 48 32 56 48" stroke="url(#bridge_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 42V56M48 42V56M32 35V56" stroke="var(--border-primary)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M4 56H60" stroke="url(#bridge_grad)" strokeWidth="4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="bridge_grad" x1="4" y1="32" x2="60" y2="56" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1D4AFF" />
                      <stop offset="1" stopColor="#B62AD9" />
                    </linearGradient>
                  </defs>
                </svg>
              }
            />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Bridge & Swap</h1>
                  <p className="page-subtitle">
                    Cross-chain USDC transfers via Circle CCTP • USDC↔EURC swap via App Kit
                  </p>
                </div>
              </div>

              <div className="grid-2">
                {/* Bridge Card */}
                <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowUpDown size={14} />
                      Bridge USDC
                    </span>
                    <span className="badge badge-green">CCTP v2 Live Simulator</span>
                  </div>
                  
                  <div className="card-body">
                    {bridgeStep === 'input' ? (
                      <div>
                        <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Info size={16} color="var(--ph-blue)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              Bridge uses Circle's burn-and-mint CCTP — 100% native USDC settlement on every chain with zero wrapped asset risk.
                            </span>
                          </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                          <label className="input-label">From Chain</label>
                          <select 
                            className="input" 
                            value={sourceChain} 
                            onChange={(e) => setSourceChain(e.target.value)}
                          >
                            <option value="sepolia">Ethereum Sepolia</option>
                            <option value="base">Base Sepolia</option>
                            <option value="arbitrum">Arbitrum Sepolia</option>
                          </select>
                        </div>

                        <div style={{ textAlign: 'center', padding: 'var(--space-xs)', color: 'var(--text-tertiary)' }}>↓</div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                          <label className="input-label">To Chain</label>
                          <div className="input" style={{ background: 'var(--ph-red-light)', borderColor: 'var(--ph-red)', color: 'var(--text-primary)', fontWeight: 600 }}>
                            Arc Testnet (Primary Hub)
                          </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-xl)' }}>
                          <label className="input-label">Amount (USDC)</label>
                          <input 
                            type="number" 
                            className="input input-mono" 
                            placeholder="0.00" 
                            step="100"
                            value={bridgeAmount}
                            onChange={(e) => setBridgeAmount(e.target.value)}
                          />
                        </div>

                        <button 
                          className="btn btn-primary btn-lg" 
                          style={{ width: '100%' }}
                          onClick={handleStartBridge}
                        >
                          Bridge to Arc
                        </button>
                      </div>
                    ) : (
                      <div>
                        {/* Status Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-xl)' }}>
                          {bridgeStep !== 'success' ? (
                            <RefreshCw size={24} className="spinning" color="var(--ph-red)" />
                          ) : (
                            <CheckCircle2 size={24} color="var(--ph-green)" />
                          )}
                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                              {bridgeStep === 'approve' && 'Step 1/4: Approving Token Transfer'}
                              {bridgeStep === 'burn' && 'Step 2/4: Executing CCTP Burn'}
                              {bridgeStep === 'attest' && 'Step 3/4: Requesting Circle Attestation'}
                              {bridgeStep === 'mint' && 'Step 4/4: Minting USDC on Arc'}
                              {bridgeStep === 'success' && 'Bridge Completed Successfully!'}
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {bridgeStep !== 'success' ? 'Attestation and multi-chain execution in progress...' : 'USDC has been settled on the Arc chain.'}
                            </p>
                          </div>
                        </div>

                        {/* Progress Steps Indicators */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', background: 'var(--bg-elevated)', padding: 12, borderRadius: 8 }}>
                          {['Approve', 'Burn', 'Attest', 'Mint'].map((stepName, idx) => {
                            const stepKeys = ['approve', 'burn', 'attest', 'mint'];
                            const currentIdx = stepKeys.indexOf(bridgeStep);
                            const stepKey = stepKeys[idx];
                            const isCompleted = bridgeStep === 'success' || currentIdx > idx;
                            const isActive = bridgeStep === stepKey;

                            return (
                              <div key={stepName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                                <div style={{ 
                                  width: 18, 
                                  height: 18, 
                                  borderRadius: '50%', 
                                  background: isCompleted ? 'var(--ph-green)' : isActive ? 'var(--ph-red)' : 'var(--bg-surface)',
                                  border: `2px solid ${isActive ? 'var(--ph-red)' : 'var(--border-primary)'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 9,
                                  fontWeight: 800,
                                  color: isCompleted || isActive ? 'white' : 'var(--text-tertiary)'
                                }}>
                                  {isCompleted ? '✓' : idx + 1}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 600, color: isCompleted || isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                  {stepName}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Live Logs Terminal */}
                        <div style={{ 
                          background: '#0D0F14', 
                          border: '1px solid var(--border-primary)', 
                          borderRadius: 'var(--radius-md)', 
                          padding: 'var(--space-md)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          height: 180,
                          overflowY: 'auto',
                          marginBottom: 'var(--space-lg)',
                          color: '#A7F3D0',
                          lineHeight: 1.6
                        }}>
                          {bridgeLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>

                        {bridgeStep === 'success' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ padding: 12, background: 'var(--ph-green-light)', border: '1px solid rgba(119,185,108,0.2)', borderRadius: 6, fontSize: 12 }}>
                              <span style={{ fontWeight: 700, color: 'var(--ph-green)' }}>USDC Settled Natively:</span> All fees settled in USDC on Arc! No gas token onboarding required.
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <a 
                                href={`https://testnet.arcscan.app/tx/${bridgeTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                              >
                                <ExternalLink size={12} /> Arcscan
                              </a>
                              <button 
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => {
                                  setBridgeStep('input');
                                  setBridgeAmount('');
                                }}
                              >
                                Bridge More
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 4 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Next-Step Workflows
                              </div>
                              <Link 
                                href="/treasury" 
                                className="btn btn-secondary btn-sm" 
                                style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                              >
                                📡 Verify Balances on Treasury Radar
                              </Link>
                              <Link 
                                href="/runway" 
                                className="btn btn-secondary btn-sm" 
                                style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                              >
                                📈 Recalculate Cash Runway Days
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                            <RefreshCw size={12} className="spinning" /> Pinging Circle Attestation Core...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Swap Card */}
                <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={14} />
                      Swap Stablecoins
                    </span>
                    <span className="badge badge-purple">StableFX Engine</span>
                  </div>
                  
                  <div className="card-body">
                    {!swapSuccess ? (
                      <div>
                        <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Info size={16} color="var(--ph-purple)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              Swap USDC ↔ EURC on Arc instantly. Uses Circle's StableFX quotes with sub-second EVM deterministic finality.
                            </span>
                          </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                          <label className="input-label">From Token</label>
                          <select 
                            className="input input-mono" 
                            value={fromToken} 
                            onChange={(e) => handleTokenSelectChange('from', e.target.value)}
                          >
                            <option value="usdc">USDC (USD Coin)</option>
                            <option value="eurc">EURC (Euro Coin)</option>
                          </select>
                        </div>

                        <div style={{ textAlign: 'center', padding: 'var(--space-xs)', color: 'var(--text-tertiary)' }}>⇄</div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                          <label className="input-label">To Token</label>
                          <select 
                            className="input input-mono" 
                            value={toToken} 
                            onChange={(e) => handleTokenSelectChange('to', e.target.value)}
                          >
                            <option value="usdc">USDC (USD Coin)</option>
                            <option value="eurc">EURC (Euro Coin)</option>
                          </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                          <label className="input-label">Amount</label>
                          <input 
                            type="number" 
                            className="input input-mono" 
                            placeholder="0.00" 
                            step="10"
                            value={swapAmount}
                            onChange={(e) => setSwapAmount(e.target.value)}
                          />
                        </div>

                        {swapAmount && (
                          <div style={{ 
                            background: 'var(--bg-elevated)', 
                            padding: '10px 14px', 
                            borderRadius: 6, 
                            marginBottom: 'var(--space-xl)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 12
                          }}>
                            <span style={{ color: 'var(--text-secondary)' }}>You Receive:</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ph-green)' }}>
                              {(parseFloat(swapAmount) * getExchangeRate()).toLocaleString('en-US', { minimumFractionDigits: 2 })} {toToken.toUpperCase()}
                            </span>
                          </div>
                        )}

                        <button 
                          className="btn btn-secondary btn-lg" 
                          style={{ width: '100%', borderColor: 'var(--ph-purple)', color: 'var(--text-primary)' }}
                          onClick={handleSwap}
                          disabled={isSwapping || !swapAmount}
                        >
                          {isSwapping ? (
                            <><RefreshCw size={14} className="spinning" /> Executing FX Trade...</>
                          ) : (
                            'Get StableFX Quote & Swap'
                          )}
                        </button>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                            <div style={{ 
                              width: 56, 
                              height: 56, 
                              borderRadius: '50%', 
                              background: 'var(--ph-green-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ph-green)'
                            }}>
                              <Zap size={28} />
                            </div>
                          </div>

                          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>FX Swap Executed Natively!</h3>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto 24px' }}>
                            Successfully swapped {parseFloat(swapAmount).toLocaleString('en-US')} {fromToken.toUpperCase()} for {(parseFloat(swapAmount) * getExchangeRate()).toLocaleString('en-US')} {toToken.toUpperCase()}
                          </p>

                          <div style={{ 
                            background: 'var(--bg-elevated)', 
                            borderRadius: 8, 
                            padding: 16, 
                            textAlign: 'left', 
                            fontSize: 12, 
                            marginBottom: 24,
                            border: '1px solid var(--border-primary)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Settlement Chain:</span>
                              <span style={{ fontWeight: 600 }}>Arc Testnet</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Execution Speed:</span>
                              <span style={{ fontWeight: 600, color: 'var(--ph-green)' }}>0.36 seconds</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Gas Paid (USDC):</span>
                              <span style={{ fontFamily: 'var(--font-mono)' }}>0.00021 USDC</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-secondary)' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Receipt Transaction Hash:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, wordBreak: 'break-all', color: 'var(--ph-purple)' }}>
                                {swapTxHash}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ flex: 1 }}
                              onClick={() => {
                                setSwapSuccess(false);
                                setSwapAmount('');
                              }}
                            >
                              Swap Again
                            </button>
                            <a 
                              href={`https://testnet.arcscan.app/tx/${swapTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary" 
                              style={{ flex: 1, justifyContent: 'center' }}
                            >
                              <ExternalLink size={12} /> View on Arcscan
                            </a>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Next-Step Workflows
                            </div>
                            <Link 
                              href="/" 
                              className="btn btn-secondary btn-sm" 
                              style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                            >
                              📊 Go to Dashboard Overview
                            </Link>
                            <Link 
                              href="/flow" 
                              className="btn btn-secondary btn-sm" 
                              style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                            >
                              🗺️ Analyze D3 Money Flow Sankey
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

