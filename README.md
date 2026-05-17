# CashFlow360

**Analytics-first Cash Flow Intelligence Platform for SMEs**

An on-chain cash flow management platform built on Arc Testnet. CashFlow360 provides real-time analytics, predictive forecasting, and cross-chain treasury management — all powered by Circle's developer stack.

## Track

**Track 2: SME Finance & Trade Workflows** — The Stablecoins Commerce Stack Challenge

## Circle Products Integrated

| Product | Status | Purpose |
|---------|--------|---------|
| **USDC** | ✅ Live | Primary stablecoin settlement rail |
| **App Kit — Send** | ✅ Live | Wallet-to-wallet USDC transfers on Arc |
| **App Kit — Bridge (CCTP)** | ✅ Live | Cross-chain USDC bridge via burn-and-mint |
| **App Kit — Swap** | 🔧 Ready | USDC↔EURC stablecoin FX conversion |
| **Unified Balance** | ✅ Live | Multi-chain treasury aggregation |
| **User-Controlled Wallets** | ✅ Live | RainbowKit wallet connection |

## Architecture

```
Frontend (Next.js 14 App Router + TypeScript)
    │
    ├── PostHog Design System (data-dense analytics UI)
    ├── RainbowKit v2 + wagmi v2 (wallet connection)
    ├── Recharts + D3.js (data visualization)
    └── Framer Motion (micro-animations)
    │
    ▼
Circle SDK Layer
    ├── App Kit Send (USDC transfers)
    ├── App Kit Bridge (CCTP v2 cross-chain)
    ├── App Kit Swap (USDC↔EURC FX)
    └── Unified Balance (multi-chain aggregation)
    │
    ▼
Arc Testnet (Chain ID: 5042002)
    ├── CashFlowVault.sol (custom smart contract)
    ├── USDC (0x3600...0000)
    └── EURC (0x89B5...D72a)
```

## Key Features

### 1. Cash Flow Dashboard
Real-time KPI cards showing USDC balance, inflows, outflows, and net cash flow — all sourced from on-chain USDC Transfer events via `viem.getLogs()`.

### 2. Live Cash Flow Sankey Map
D3.js-powered Sankey diagram that visualizes USDC money flows in real-time. Sources (senders) flow through your Treasury to destinations (recipients). Animated SVG paths render from on-chain event data.

### 3. Cross-Chain Treasury Radar
SVG radar visualization showing USDC holdings across Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, and Arc Testnet. Powered by parallel `useReadContract` calls. Animated pulse dots show active chains.

### 4. Predictive Cash Flow Runway Calculator
Deterministic cash runway analysis based on historical on-chain transaction patterns. Interactive "What-If" scenario sliders for revenue changes, extra expenses, and bridge-in capital. 90-day projection chart with danger/warning/safe zones.

### 5. Send USDC
Real on-chain USDC transfers via `wagmi.useWriteContract`. Wallet confirmation, loading states, success verification with Arcscan explorer links.

### 6. Bridge & Swap
Cross-chain USDC bridge interface (CCTP v2) and USDC↔EURC swap interface using App Kit.

## Setup

```bash
# Clone the repository
git clone https://github.com/garadieu/cashflow360.git
cd cashflow360

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your WalletConnect Project ID

# Start development server
npm run dev

# Open http://localhost:3000
```

### Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask, Rainbow, etc.)
- Testnet USDC from [Circle Faucet](https://faucet.circle.com)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Wallet | RainbowKit v2 + wagmi v2 |
| Chain | viem + Arc Testnet |
| Charts | Recharts + D3.js |
| Animation | Framer Motion |
| Design | PostHog Design System (Vanilla CSS) |
| Smart Contracts | Solidity + Hardhat |
| Blockchain | Arc Testnet (Chain ID: 5042002) |

## On-Chain Data Integrity

CashFlow360 uses **zero mock data**. All analytics are derived from:

1. **USDC Transfer events** — Indexed via `publicClient.getLogs()` on Arc Testnet
2. **Real-time balance reads** — Via `useReadContract` against USDC/EURC ERC-20 contracts
3. **Multi-chain balance aggregation** — Parallel contract reads across 4 testnets
4. **Transaction verification** — Every transaction links to [Arcscan Explorer](https://testnet.arcscan.app)

## Circle Product Feedback

### Why We Chose These Products
CashFlow360 requires real-time on-chain data, cross-chain treasury visibility, and instant settlement. Circle's USDC on Arc provides predictable, dollar-denominated transactions essential for financial analytics. App Kit's Send, Bridge, and Swap capabilities give SMEs a complete treasury management toolkit.

### What Worked Well
- Arc's sub-second finality makes real-time analytics genuinely real-time
- USDC as native gas token eliminates the gas token onboarding friction
- Unified Balance concept perfectly maps to our Treasury Radar feature
- CCTP's burn-and-mint model gives confidence in cross-chain balance integrity

### What Could Be Improved
- App Kit TypeScript types could be more ergonomic for wagmi v2 integration
- A pre-built React component for Unified Balance visualization would accelerate development
- More granular webhook events for transaction categorization would enhance analytics
- Transaction history API or indexer service would reduce client-side event scanning overhead

### Recommendations
- Provide an official "Treasury Dashboard" template for SME use cases
- Add transaction tagging/categorization to the USDC contract or via an indexer
- Consider a React SDK with pre-built components (balance cards, flow charts, bridge modals)

## License

MIT
