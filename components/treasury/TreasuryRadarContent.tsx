'use client';

import { useAccount, useUSDCBalance } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { Radar, Globe, ArrowRightLeft, Shield } from 'lucide-react';
import { sepolia, baseSepolia, arbitrumSepolia } from 'viem/chains';
import { arcTestnet, USDC_ADDRESS } from '@/lib/arc-config';
import { USDC_ABI } from '@/lib/contracts';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletEmptyState } from '@/components/ui/WalletEmptyState';

// Known USDC addresses on testnets
const TESTNET_USDC: Record<number, `0x${string}`> = {
  [sepolia.id]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [arbitrumSepolia.id]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
};

interface ChainBalance {
  chainId: number;
  chainName: string;
  symbol: string;
  balance: string;
  color: string;
  angle: number; // position on radar circle
}

function useMultiChainBalances() {
  const { address } = useAccount();

  const { formatted: arcBalance } = useUSDCBalance();

  const { data: sepoliaBalance } = useReadContract({
    address: TESTNET_USDC[sepolia.id],
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!address, refetchInterval: 15000 },
  });

  const { data: baseBalance } = useReadContract({
    address: TESTNET_USDC[baseSepolia.id],
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address, refetchInterval: 15000 },
  });

  const { data: arbBalance } = useReadContract({
    address: TESTNET_USDC[arbitrumSepolia.id],
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arbitrumSepolia.id,
    query: { enabled: !!address, refetchInterval: 15000 },
  });

  const chains: ChainBalance[] = [
    {
      chainId: arcTestnet.id,
      chainName: 'Arc Testnet',
      symbol: 'ARC',
      balance: arcBalance,
      color: '#F54E00',
      angle: 0,
    },
    {
      chainId: sepolia.id,
      chainName: 'Ethereum Sepolia',
      symbol: 'ETH',
      balance: sepoliaBalance ? formatUnits(sepoliaBalance as bigint, 6) : '0.00',
      color: '#627EEA',
      angle: 90,
    },
    {
      chainId: baseSepolia.id,
      chainName: 'Base Sepolia',
      symbol: 'BASE',
      balance: baseBalance ? formatUnits(baseBalance as bigint, 6) : '0.00',
      color: '#0052FF',
      angle: 180,
    },
    {
      chainId: arbitrumSepolia.id,
      chainName: 'Arbitrum Sepolia',
      symbol: 'ARB',
      balance: arbBalance ? formatUnits(arbBalance as bigint, 6) : '0.00',
      color: '#28A0F0',
      angle: 270,
    },
  ];

  const totalBalance = chains.reduce((sum, c) => sum + parseFloat(c.balance), 0);

  return { chains, totalBalance };
}

export default function TreasuryRadarContent() {
  const { isConnected } = useAccount();
  const { chains, totalBalance } = useMultiChainBalances();

  if (!isConnected) {
    return (
      <WalletEmptyState
        title="Connect Wallet for Treasury Radar"
        description="View your USDC holdings across Ethereum, Base, Arbitrum, and Arc — all in one radar view."
        svgIcon={
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 16C24 16 18 22 18 30C18 32 44 32 46 30C46 22 40 16 32 16Z" fill="url(#radar_grad)" />
            <path d="M8 32C8 32 16 40 32 40C48 40 56 32 56 32" stroke="url(#radar_grad)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="48" r="4" fill="var(--border-primary)" />
            <circle cx="20" cy="44" r="3" fill="var(--border-primary)" />
            <circle cx="44" cy="44" r="3" fill="var(--border-primary)" />
            <defs>
              <linearGradient id="radar_grad" x1="8" y1="16" x2="56" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F54E00" />
                <stop offset="1" stopColor="#B62AD9" />
              </linearGradient>
            </defs>
          </svg>
        }
      />
    );
  }

  const radarRadius = 180;
  const centerX = 250;
  const centerY = 250;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cross-Chain Treasury Radar</h1>
          <p className="page-subtitle">
            Unified view of USDC across 4 blockchains • Powered by Circle Unified Balance
          </p>
        </div>
      </div>

      {/* Total Unified Balance */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 'var(--space-xl)' }}
      >
        <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            <Globe size={14} style={{ display: 'inline', marginRight: 6 }} />
            Unified USDC Balance (4 Chains)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em' }}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
            <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
            Circle CCTP • Burn-and-Mint • Native USDC on every chain
          </div>
        </div>
      </motion.div>

      <div className="grid-2">
        {/* Radar Visualization */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <span className="card-title">
              <Radar size={14} style={{ display: 'inline', marginRight: 6 }} />
              Treasury Radar
            </span>
            <span className="badge badge-green">Live</span>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={500} height={500} viewBox="0 0 500 500" style={{ maxWidth: '100%' }}>
              {/* Radar rings */}
              {[0.33, 0.66, 1].map((scale, i) => (
                <circle
                  key={i}
                  cx={centerX}
                  cy={centerY}
                  r={radarRadius * scale}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}

              {/* Cross lines */}
              <line x1={centerX} y1={centerY - radarRadius} x2={centerX} y2={centerY + radarRadius} stroke="rgba(255,255,255,0.04)" />
              <line x1={centerX - radarRadius} y1={centerY} x2={centerX + radarRadius} y2={centerY} stroke="rgba(255,255,255,0.04)" />

              {/* Connection lines to chains */}
              {chains.map((chain, i) => {
                const angle = (chain.angle * Math.PI) / 180;
                const x = centerX + Math.cos(angle) * radarRadius;
                const y = centerY + Math.sin(angle) * radarRadius;
                const bal = parseFloat(chain.balance);
                const lineOpacity = bal > 0 ? 0.4 : 0.1;

                return (
                  <g key={chain.chainId}>
                    {/* Connection line */}
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke={chain.color}
                      strokeWidth={bal > 0 ? 2 : 1}
                      strokeOpacity={lineOpacity}
                      strokeDasharray={bal > 0 ? 'none' : '4 4'}
                    />

                    {/* Animated pulse on line */}
                    {bal > 0 && (
                      <circle r={3} fill={chain.color} opacity={0.8}>
                        <animateMotion
                          dur="3s"
                          repeatCount="indefinite"
                          path={`M${centerX},${centerY} L${x},${y}`}
                        />
                      </circle>
                    )}

                    {/* Chain node */}
                    <circle
                      cx={x}
                      cy={y}
                      r={24}
                      fill="var(--bg-elevated)"
                      stroke={chain.color}
                      strokeWidth={2}
                    />

                    {/* Chain symbol */}
                    <text
                      x={x}
                      y={y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={chain.color}
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="Inter, sans-serif"
                    >
                      {chain.symbol}
                    </text>

                    {/* Chain name label */}
                    <text
                      x={x}
                      y={y + 40}
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      fontSize={10}
                      fontWeight={600}
                      fontFamily="Inter, sans-serif"
                    >
                      {chain.chainName}
                    </text>

                    {/* Balance label */}
                    <text
                      x={x}
                      y={y + 54}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize={12}
                      fontWeight={700}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      ${parseFloat(chain.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </text>
                  </g>
                );
              })}

              {/* Center node — Arc (primary) */}
              <circle cx={centerX} cy={centerY} r={36} fill="url(#centerGrad)" />
              <defs>
                <radialGradient id="centerGrad">
                  <stop offset="0%" stopColor="#FF7A33" />
                  <stop offset="100%" stopColor="#F54E00" />
                </radialGradient>
              </defs>
              <text
                x={centerX}
                y={centerY - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={12}
                fontWeight={800}
                fontFamily="Inter, sans-serif"
              >
                ARC
              </text>
              <text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.7)"
                fontSize={8}
                fontWeight={600}
                fontFamily="Inter, sans-serif"
              >
                HUB
              </text>
            </svg>
          </div>
        </motion.div>

        {/* Chain Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
        >
          {chains.map((chain) => {
            const bal = parseFloat(chain.balance);
            const pct = totalBalance > 0 ? (bal / totalBalance) * 100 : 0;

            return (
              <div key={chain.chainId} className="card">
                <div className="card-body-compact">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: chain.color }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{chain.chainName}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>
                      ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      style={{ height: '100%', background: chain.color, borderRadius: 3 }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {pct.toFixed(1)}% of total treasury
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="card">
            <div className="card-body-compact" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="card-title" style={{ marginBottom: 4 }}>
                <ArrowRightLeft size={14} style={{ display: 'inline', marginRight: 6 }} />
                Quick Actions
              </div>
              <a href="/bridge" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>
                Bridge USDC to Arc
              </a>
              <a href="/send" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>
                Send USDC on Arc
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
