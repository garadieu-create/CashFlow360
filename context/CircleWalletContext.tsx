'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPublicClient, http, parseEther, formatUnits, parseUnits, Hex } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction';
import { 
  toCircleSmartAccount, 
  toModularTransport, 
  toPasskeyTransport, 
  toWebAuthnCredential, 
  WebAuthnMode 
} from '@circle-fin/modular-wallets-core';
import { arcTestnet } from '@/lib/arc-config';
import { sepolia, baseSepolia, arbitrumSepolia } from 'viem/chains';
import toast from 'react-hot-toast';
import { Shield, Sparkles, Key, Mail, RefreshCw, LogOut, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CircleWalletContextType {
  address: `0x${string}` | null;
  isConnected: boolean;
  socialEmail: string | null;
  isLoading: boolean;
  smartAccount: any | null;
  loginWithPasskey: (username: string) => Promise<void>;
  loginWithEmail: (email: string, otp: string) => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  logout: () => void;
  executeContractWrite: (
    contractAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args: any[],
    chainId?: number
  ) => Promise<`0x${string}`>;
  isLastTxSponsored: boolean;
  gasSponsoredCount: number;
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
}

const CircleWalletContext = createContext<CircleWalletContextType | undefined>(undefined);

export function CircleWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socialEmail, setSocialEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState<any | null>(null);
  const [isLastTxSponsored, setIsLastTxSponsored] = useState(false);
  const [gasSponsoredCount, setGasSponsoredCount] = useState(0);

  // Circle User PIN States
  const [pinWalletId, setPinWalletId] = useState<string | null>(null);
  const [pinCredentials, setPinCredentials] = useState<{ userToken: string; encryptionKey: string; appId?: string } | null>(null);
  const [pinChallengeId, setPinChallengeId] = useState<string | null>(null);
  const [isChallengeActive, setIsChallengeActive] = useState(false);

  // Confetti trigger helper
  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn('Failed to fire confetti effect:', e);
    }
  };

  // Onboarding overlay states
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState<'passkey' | 'email'>('passkey');
  const [username, setUsername] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Circle Modular Transport — created lazily only when toCircleSmartAccount needs it.
  // Eager creation causes viem to make RPC init calls through Circle's SDK endpoint on page load,
  // triggering "Cannot find entity config" errors before any user action.
  const clientUrl = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL || 'https://modular-sdk.circle.com/v1/rpc/w3s/buidl';
  const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY || '';

  const getModularClient = () => createPublicClient({
    chain: arcTestnet,
    transport: toModularTransport(`${clientUrl}/arcTestnet`, clientKey)
  });

  // Get Circle Web SDK instance dynamically to prevent SSR errors
  const getW3SSdk = async (appId: string) => {
    const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk');
    const finalAppId = appId || process.env.NEXT_PUBLIC_CIRCLE_APP_ID || '';
    console.log('[Circle W3SSdk] Initializing with appId:', finalAppId || '(EMPTY — will cause error 155114!)');
    if (!finalAppId) {
      console.error('[Circle W3SSdk] CRITICAL: No appId available! Set NEXT_PUBLIC_CIRCLE_APP_ID in .env');
    }
    return new W3SSdk({ appSettings: { appId: finalAppId } });
  };

  // Restore session from localStorage on mount & Intercept WebAuthn RP ID on localhost
  useEffect(() => {
    // Intercept WebAuthn RP ID on localhost to avoid credential creation errors
    if (typeof window !== 'undefined' && window.navigator?.credentials) {
      const originalCreate = window.navigator.credentials.create.bind(window.navigator.credentials);
      window.navigator.credentials.create = async function (options: any) {
        if (options?.publicKey?.rp?.id) {
          options.publicKey.rp.id = window.location.hostname;
        }
        if (options?.publicKey?.authenticatorSelection?.authenticatorAttachment === 'platform') {
          delete options.publicKey.authenticatorSelection.authenticatorAttachment;
        }
        return originalCreate(options);
      };

      const originalGet = window.navigator.credentials.get.bind(window.navigator.credentials);
      window.navigator.credentials.get = async function (options: any) {
        if (options?.publicKey?.rpId) {
          options.publicKey.rpId = window.location.hostname;
        }
        if (options?.publicKey?.rp?.id) {
          options.publicKey.rp.id = window.location.hostname;
        }
        return originalGet(options);
      };
    }

    const restoreSession = async () => {
      const saved = sessionStorage.getItem('circle_smart_account_session');
      if (saved) {
        try {
          setIsLoading(true);
          const session = JSON.parse(saved);
          if (session.method === 'passkey' && session.credential) {
            const owner = toWebAuthnAccount({ credential: session.credential });
            const account = await toCircleSmartAccount({
              client: getModularClient(),
              owner,
              name: session.username || 'CashFlow360 User'
            });
            setSmartAccount(account);
            setAddress(account.address as `0x${string}`);
            setIsConnected(true);
            setSocialEmail(session.username || null);
          } else if (session.method === 'pin') {
            setAddress(session.address);
            setSocialEmail(session.socialEmail);
            setPinCredentials({
              userToken: session.userToken,
              encryptionKey: session.encryptionKey,
              appId: session.appId
            });
            setPinWalletId(session.walletId);
            setIsConnected(true);
          }
        } catch (e) {
          console.warn('Circle session restore failed — clearing stale session:', (e as any)?.shortMessage || (e as any)?.message);
          sessionStorage.removeItem('circle_smart_account_session');
          setShowOverlay(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowOverlay(true);
      }
    };
    restoreSession();
  }, []);

  const fetchWallets = async (userToken: string, encryptionKey: string, appId: string, userId: string) => {
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list-wallets', userToken })
    });
    const data = await res.json();
    if (data.success && data.wallets && data.wallets.length > 0) {
      const wallet = data.wallets.find((w: any) => w.blockchain === 'arc-testnet') || data.wallets[0];
      const address = wallet.address;
      const walletId = wallet.id;

      // Save session
      sessionStorage.setItem('circle_smart_account_session', JSON.stringify({
        method: 'pin',
        address,
        socialEmail: userId,
        userToken,
        encryptionKey,
        walletId,
        appId
      }));

      setAddress(address as `0x${string}`);
      setSocialEmail(userId);
      setPinCredentials({ userToken, encryptionKey, appId });
      setPinWalletId(walletId);
      setIsConnected(true);
      setShowOverlay(false);
    } else {
      throw new Error(data.error || 'No wallets found. Please initialize first.');
    }
  };

  const loginWithPasskey = async (user: string) => {
    if (!user) {
      toast.error('Please enter a username');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Initializing biometric WebAuthn prompt...');
    try {
      const passkeyTransport = toPasskeyTransport(clientUrl, clientKey);
      
      let credentialJson = localStorage.getItem(`circle_credential_${user}`);
      let credential;
      
      if (credentialJson) {
        try {
          credential = JSON.parse(credentialJson);
          toast.loading('Loading saved passkey credential...', { id: toastId });
        } catch (e) {
          localStorage.removeItem(`circle_credential_${user}`);
        }
      }

      if (!credential) {
        // Register a new WebAuthn credential
        credential = await toWebAuthnCredential({
          transport: passkeyTransport,
          mode: WebAuthnMode.Register,
          username: user
        });
        localStorage.setItem(`circle_credential_${user}`, JSON.stringify(credential));
      } else {
        // Attempt login WebAuthn credential
        try {
          credential = await toWebAuthnCredential({
            transport: passkeyTransport,
            mode: WebAuthnMode.Login
          });
        } catch (err) {
          console.warn('Login credential failed, attempting registration fallback...', err);
          credential = await toWebAuthnCredential({
            transport: passkeyTransport,
            mode: WebAuthnMode.Register,
            username: user
          });
          localStorage.setItem(`circle_credential_${user}`, JSON.stringify(credential));
        }
      }

      toast.loading('Deriving Smart Account owner from passkey...', { id: toastId });
      const owner = toWebAuthnAccount({ credential });

      const account = await toCircleSmartAccount({
        client: getModularClient(),
        owner,
        name: user
      });

      // Save session
      sessionStorage.setItem('circle_smart_account_session', JSON.stringify({
        method: 'passkey',
        credential,
        smartAccountAddress: account.address,
        username: user
      }));

      setSmartAccount(account);
      setAddress(account.address as `0x${string}`);
      setIsConnected(true);
      setShowOverlay(false);
      toast.success(`Welcome back, ${user}! Smart Account initialized.`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Passkey login failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailOtp = async (email: string) => {
    if (!email || email.length < 5) {
      toast.error('Please enter a username or identifier (min 5 characters)');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Connecting to Circle PIN infrastructure...');
    try {
      // 1. Create user in Circle's system
      const createRes = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-user', userId: email })
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || 'Failed to sync user with Circle');
      }

      // 2. Retrieve user session token
      const tokenRes = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-token', userId: email })
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error || 'Failed to get user session token');
      }

      const { userToken, encryptionKey, appId } = tokenData;

      // 3. Initialize PIN and create wallet
      const initRes = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize', userToken })
      });
      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData.error || 'Failed to initialize PIN challenge');
      }

      if (initData.code === 155106) {
        // Already initialized, directly fetch wallets
        toast.loading('Fetching existing wallets...', { id: toastId });
        await fetchWallets(userToken, encryptionKey, appId, email);
        toast.success('Successfully restored PIN wallet session!', { id: toastId });
      } else if (initData.challengeId) {
        // Needs PIN Setup
        setPinChallengeId(initData.challengeId);
        setPinCredentials({ userToken, encryptionKey, appId });
        setOtpSent(true);
        toast.success('Ready to secure wallet with PIN. Click below to proceed.', { id: toastId });
      } else {
        throw new Error('Unknown initialization state');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to connect PIN wallet', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, otp: string) => {
    if (!pinChallengeId || !pinCredentials) {
      toast.error('PIN challenge not loaded. Please connect first.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Opening secure Circle PIN setup window...');
    try {
      const sdk = await getW3SSdk(pinCredentials.appId || '');
      sdk.setAuthentication({
        userToken: pinCredentials.userToken,
        encryptionKey: pinCredentials.encryptionKey
      });

      sdk.execute(pinChallengeId, (error, result) => {
        if (error) {
          console.error('[Circle PIN Error]:', error);
          toast.error(error.message || 'PIN setup failed', { id: toastId });
          setIsLoading(false);
          return;
        }

        console.log('[Circle PIN Success]:', result);
        toast.loading('Deploying user smart account...', { id: toastId });

        fetchWallets(pinCredentials.userToken, pinCredentials.encryptionKey, pinCredentials.appId || '', email)
          .then(() => {
            toast.success('Wallet created and synchronized successfully!', { id: toastId });
          })
          .catch((err: any) => {
            toast.error(err.message || 'Failed to list created wallets', { id: toastId });
          })
          .finally(() => {
            setIsLoading(false);
          });
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to start PIN window', { id: toastId });
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('circle_smart_account_session');
    setSmartAccount(null);
    setAddress(null);
    setIsConnected(false);
    setSocialEmail(null);
    setOtpSent(false);
    setEmailInput('');
    setOtpInput('');
    setUsername('');
    setPinWalletId(null);
    setPinCredentials(null);
    setPinChallengeId(null);
    setShowOverlay(true);
    toast.success('Disconnected session successfully.');
  };

  const getChainInfo = (id?: number) => {
    if (id === 11155111) return { name: 'sepolia', chain: sepolia };
    if (id === 84532) return { name: 'baseSepolia', chain: baseSepolia };
    if (id === 421614) return { name: 'arbitrumSepolia', chain: arbitrumSepolia };
    return { name: 'arcTestnet', chain: arcTestnet };
  };

  // Gasless Contract Writer (Dual-mode support for WebAuthn smart account & User-Controlled PIN wallets)
  const executeContractWrite = async (
    contractAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args: any[],
    chainId?: number
  ): Promise<`0x${string}`> => {
    // 1. PIN Wallet execution flow (Challenge-response with User-Controlled Web SDK)
    if (pinCredentials && pinWalletId) {
      const toastId = toast.loading('Initiating contract execution challenge...');
      setIsLastTxSponsored(false);
      try {
        const { encodeFunctionData } = await import('viem');
        const callData = encodeFunctionData({
          abi,
          functionName,
          args
        });

        toast.loading('Requesting signature authorization...', { id: toastId });
        const res = await fetch('/api/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute-contract',
            userToken: pinCredentials.userToken,
            walletId: pinWalletId,
            contractAddress,
            callData
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate contract execution challenge');
        }

        toast.loading('Opening secure PIN prompt...', { id: toastId });
        const sdk = await getW3SSdk(pinCredentials.appId || '');
        sdk.setAuthentication({
          userToken: pinCredentials.userToken,
          encryptionKey: pinCredentials.encryptionKey
        });

        setIsChallengeActive(true);

        return new Promise<`0x${string}`>((resolve, reject) => {
          sdk.execute(data.challengeId, (error, result) => {
            setIsChallengeActive(false);
            if (error) {
              console.error('[Circle PIN Tx Error]:', error);
              toast.error(error.message || 'Transaction authorization failed', { id: toastId });
              reject(error);
              return;
            }
            console.log('[Circle PIN Tx Success]:', result);
            setIsLastTxSponsored(true);
            setGasSponsoredCount(prev => prev + 1);
            toast.success('Transaction submitted to blockchain!', { id: toastId });
            triggerConfetti();
            resolve(((result as any)?.txHash || '0x') as `0x${string}`);
          });
        });
      } catch (error: any) {
        setIsChallengeActive(false);
        console.error('PIN Contract execution failed:', error);
        toast.error(error.message || 'Transaction failed', { id: toastId });
        throw error;
      }
    }

    // 2. Passkey / WebAuthn smart account execution flow
    if (!smartAccount) {
      throw new Error('Circle Smart Account is not initialized');
    }

    const { name: chainName, chain: targetChain } = getChainInfo(chainId);

    const toastId = toast.loading(`Initiating gasless sponsored transaction via Circle on ${targetChain.name}...`);
    setIsLastTxSponsored(false);

    try {
      const clientUrl = 'https://modular-sdk.circle.com/v1/rpc/w3s/buidl';
      const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY || 'sandbox_kit_key_placeholder';
      const modularTransport = toModularTransport(`${clientUrl}/arcTestnet`, clientKey);

      // Create bundler client
      const bundlerClient = createBundlerClient({
        chain: targetChain,
        transport: modularTransport
      });

      toast.loading(`Constructing sponsored UserOperation for ${functionName}...`, { id: toastId });

      // Build call target
      let callData: `0x${string}` = '0x';
      try {
        const { encodeFunctionData } = await import('viem');
        callData = encodeFunctionData({
          abi,
          functionName,
          args
        });
      } catch (e) {
        console.warn('Failed to encode function data:', e);
      }

      // Submit sponsored UserOperation
      let userOpHash: `0x${string}`;
      let gasPrice = { maxPriorityFeePerGas: 15000000000n, maxFeePerGas: 60000000000n }; // Safe fallback
      try {
        // Query dynamic gas prices
        try {
          const response = await fetch(`${clientUrl}/arcTestnet`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${clientKey}`
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'circle_getUserOperationGasPrice'
            })
          });
          const resData = await response.json();
          if (resData?.result?.medium) {
            gasPrice = {
              maxPriorityFeePerGas: BigInt(resData.result.medium.maxPriorityFeePerGas),
              maxFeePerGas: BigInt(resData.result.medium.maxFeePerGas)
            };
          }
        } catch (e) {
          console.warn('Fallback to standard gas values', e);
        }

        userOpHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [{
            to: contractAddress,
            value: 0n,
            data: callData,
          }],
          paymaster: true, // Requests gasless sponsorship from Circle
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
          maxFeePerGas: gasPrice.maxFeePerGas
        });
      } catch (err: any) {
        console.warn('Sponsored bundler submission failed, retrying with boosted gas:', err);
        toast.loading('Retrying with adjusted gas parameters...', { id: toastId });

        // Retry with 2x boosted gas — handles underestimation & mempool congestion
        try {
          userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [{
              to: contractAddress,
              value: 0n,
              data: callData,
            }],
            paymaster: true,
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas * 2n,
            maxFeePerGas: gasPrice.maxFeePerGas * 2n
          });
        } catch (retryErr: any) {
          console.error('Retry also failed:', retryErr);
          // Surface the original bundler error, not a misleading private-key message
          const msg = err?.shortMessage || err?.message || retryErr?.message || 'Bundler UserOperation submission failed';
          throw new Error(msg);
        }
      }

      setIsLastTxSponsored(true);
      setGasSponsoredCount(prev => prev + 1);
      toast.success(`Transaction executed with Circle Gasless Sponsorship on ${targetChain.name}!`, { id: toastId });
      triggerConfetti();
      return userOpHash;
    } catch (error: any) {
      console.error('Contract execution failed:', error);
      toast.error(error.message || 'Transaction failed', { id: toastId });
      throw error;
    }
  };

  return (
    <CircleWalletContext.Provider
      value={{
        address,
        isConnected,
        socialEmail,
        isLoading,
        smartAccount,
        loginWithPasskey,
        loginWithEmail,
        sendEmailOtp,
        logout,
        executeContractWrite,
        isLastTxSponsored,
        gasSponsoredCount,
        showOverlay,
        setShowOverlay
      }}
    >
      {children}

      {/* Onboarding Overlay / Modal */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 11, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              style={{
                background: 'var(--bg-surface)',
                border: '2px solid var(--text-primary)',
                borderRadius: '0px',
                maxWidth: 440,
                width: '100%',
                padding: 32,
                boxShadow: '8px 8px 0px rgba(0,0,0,0.95)',
                color: 'var(--text-primary)'
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '0px',
                  background: 'rgba(245, 78, 0, 0.1)',
                  border: '2px solid var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '3px 3px 0px rgba(0,0,0,1)'
                }}>
                  <Shield size={24} color="#F54E00" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Initialize Smart Account
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Access gasless enterprise treasury powered by Circle
                </p>
              </div>

              {/* Tab Selectors */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                borderRadius: '0px',
                padding: 4,
                marginBottom: 24,
                border: '2px solid var(--text-primary)'
              }}>
                <button
                  onClick={() => { setActiveTab('passkey'); setOtpSent(false); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '0px',
                    fontSize: 13,
                    fontWeight: 800,
                    border: 'none',
                    background: activeTab === 'passkey' ? '#F54E00' : 'transparent',
                    color: activeTab === 'passkey' ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Key size={14} /> Passkey
                </button>
                <button
                  onClick={() => { setActiveTab('email'); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '0px',
                    fontSize: 13,
                    fontWeight: 800,
                    border: 'none',
                    background: activeTab === 'email' ? '#F54E00' : 'transparent',
                    color: activeTab === 'email' ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Mail size={14} /> Circle PIN
                </button>
              </div>

              {/* Form Panels */}
              {activeTab === 'passkey' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center' }}>
                      Username or Identifier
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">
                          Unique local identifier to register your biometric passkey.
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. alice.cashflow"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      style={{ background: 'var(--bg-secondary)', border: '2px solid var(--text-primary)', borderRadius: '0px' }}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => loginWithPasskey(username)}
                    disabled={isLoading || !username}
                    style={{
                      width: '100%',
                      background: 'var(--ph-red)',
                      border: '2px solid var(--text-primary)',
                      boxShadow: '4px 4px 0px rgba(0,0,0,1)',
                      borderRadius: '0px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      height: 44,
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="spinning" /> Authenticating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Connect with Biometrics
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center' }}>
                      Email / User Identifier
                      <span className="tooltip-container">
                        <span className="tooltip-trigger">?</span>
                        <span className="tooltip-content">
                          Your email or unique user identifier to connect a non-custodial Circle PIN smart wallet.
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. name@company.com or username"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      disabled={isLoading || otpSent}
                      style={{ background: 'var(--bg-secondary)', border: '2px solid var(--text-primary)', borderRadius: '0px' }}
                    />
                  </div>

                  {otpSent && (
                    <div style={{ padding: 12, background: 'rgba(245, 78, 0, 0.08)', border: '2px dashed #F54E00', color: 'var(--text-primary)', fontSize: 13, textAlign: 'center', margin: '4px 0' }}>
                      PIN setup initialized. Click below to enter your secure PIN in the Circle secure popup window.
                    </div>
                  )}

                  {!otpSent ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => sendEmailOtp(emailInput)}
                      disabled={isLoading || !emailInput}
                      style={{
                        width: '100%',
                        background: 'var(--ph-red)',
                        border: '2px solid var(--text-primary)',
                        boxShadow: '4px 4px 0px rgba(0,0,0,1)',
                        borderRadius: '0px',
                        height: 44,
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {isLoading ? <RefreshCw size={16} className="spinning" /> : 'Connect PIN Wallet'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => loginWithEmail(emailInput, '')}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        background: 'var(--ph-green)',
                        border: '2px solid var(--text-primary)',
                        boxShadow: '4px 4px 0px rgba(0,0,0,1)',
                        borderRadius: '0px',
                        height: 44,
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'black',
                        cursor: 'pointer'
                      }}
                    >
                      {isLoading ? <RefreshCw size={16} className="spinning" /> : 'Enter PIN & Initialize'}
                    </button>
                  )}
                </div>
              )}

              {/* Explore as Guest Option */}
              <button
                onClick={() => setShowOverlay(false)}
                style={{
                  marginTop: 16,
                  width: '100%',
                  background: 'transparent',
                  border: '2px dashed var(--border-primary)',
                  color: 'var(--text-primary)',
                  height: 40,
                  borderRadius: '0px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ph-red)';
                  e.currentTarget.style.color = 'var(--ph-red)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                Explore Platform (Guest Mode)
              </button>

              {/* Network Banner */}
              <div style={{
                marginTop: 20,
                padding: 12,
                background: 'var(--bg-secondary)',
                borderRadius: '0px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--text-secondary)',
                border: '2px solid var(--text-primary)'
              }}>
                <Info size={14} color="#F54E00" />
                <span>All smart account transactions are fully gas-sponsored on Arc Testnet.</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* PIN Challenge Active Overlay */}
      <AnimatePresence>
        {isChallengeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 11, 15, 0.95)',
              backdropFilter: 'blur(10px)',
              zIndex: 20000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{
                background: 'var(--bg-surface)',
                border: '2px solid var(--text-primary)',
                padding: 32,
                maxWidth: 400,
                width: '100%',
                boxShadow: '8px 8px 0px rgba(0,0,0,0.95)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(245, 78, 0, 0.1)',
                border: '2px solid var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}>
                <Shield size={28} color="#F54E00" className="spinning" style={{ animationDuration: '3s' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Verification Required
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Please enter your PIN in the secure Circle verification window to authorize this transaction.
              </p>
              <div style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)',
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                width: '100%'
              }}>
                🔒 Protected by Circle Multi-Party Computation
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CircleWalletContext.Provider>
  );
}

export function useCircleWallet() {
  const context = useContext(CircleWalletContext);
  if (context === undefined) {
    throw new Error('useCircleWallet must be used within a CircleWalletProvider');
  }
  return context;
}
