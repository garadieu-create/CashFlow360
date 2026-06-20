export interface UserFriendlyError {
  code: string;
  title: string;
  description: string;
  badge: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Parsed error signatures and their matching user-friendly strings.
 */
export function mapRawError(error: any): UserFriendlyError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      title: 'Unexpected System Issue',
      description: 'An unknown system issue occurred. Please check your connection or contact support.',
      badge: 'System Failure',
      severity: 'error',
    };
  }

  const rawMessage = (error.message || error.toString() || '').toLowerCase();
  const rawCode = error.code || '';

  // 1. Wallet & Signature Errors
  if (
    rawMessage.includes('user rejected') ||
    rawMessage.includes('user denied') ||
    rawMessage.includes('rejected by user') ||
    rawCode === 4001 ||
    rawCode === 'ACTION_REJECTED'
  ) {
    return {
      code: 'WALLET_SIGNATURE_REJECTED',
      title: 'Signature Declined',
      description: 'You declined the transaction signing request in your wallet. If this was a mistake, you can safely try again.',
      badge: 'Wallet Alert',
      severity: 'warning',
    };
  }

  if (rawMessage.includes('connector not connected') || rawMessage.includes('wallet not connected')) {
    return {
      code: 'WALLET_DISCONNECTED',
      title: 'Wallet Disconnected',
      description: 'Your Web3 wallet is disconnected. Please click Connect Wallet to re-authenticate.',
      badge: 'Connection Lost',
      severity: 'error',
    };
  }

  // 2. Blockchain / Gas & Balance Errors
  if (
    rawMessage.includes('insufficient funds for gas') ||
    rawMessage.includes('out of gas') ||
    rawMessage.includes('gas limit')
  ) {
    return {
      code: 'INSUFFICIENT_GAS_TOKENS',
      title: 'Gas Shortage Alert',
      description: 'Your wallet lacks enough native gas tokens (USDC or gas asset) to pay transaction fees. Please use the faucet or top up your wallet.',
      badge: 'Gas Shortage',
      severity: 'error',
    };
  }

  if (
    rawMessage.includes('transfer amount exceeds balance') ||
    rawMessage.includes('insufficient balance') ||
    rawMessage.includes('insufficient funds')
  ) {
    return {
      code: 'INSUFFICIENT_BALANCE',
      title: 'Insufficient Balance',
      description: 'The transaction amount exceeds your available USDC balance. Please fund your wallet or reduce the execution amount.',
      badge: 'Insufficient Funds',
      severity: 'error',
    };
  }

  if (rawMessage.includes('erc20: transfer amount exceeds allowance') || rawMessage.includes('allowance')) {
    return {
      code: 'INSUFFICIENT_ALLOWANCE',
      title: 'Approval Limits Exceeded',
      description: 'The requested transfer exceeds the contract approval limits. Please increase the spending allowance and try again.',
      badge: 'Allowance Exceeded',
      severity: 'warning',
    };
  }

  // 3. Network & API Errors
  if (rawMessage.includes('http 429') || rawMessage.includes('too many requests') || rawMessage.includes('rate limit')) {
    return {
      code: 'API_RATE_LIMIT_ERROR',
      title: 'Too Many Requests',
      description: 'The platform is receiving too many requests from your IP. Please wait a few moments before trying again.',
      badge: 'Rate Limited',
      severity: 'warning',
    };
  }

  if (rawMessage.includes('timeout') || rawMessage.includes('deadline exceeded') || rawMessage.includes('request timed out')) {
    return {
      code: 'NETWORK_TIMEOUT_ERROR',
      title: 'Request Timed Out',
      description: 'The request took too long to resolve. This may be due to heavy blockchain network congestion or API server delays.',
      badge: 'Network Timeout',
      severity: 'error',
    };
  }

  // 4. Contract Logic & Execution Reverts
  if (rawMessage.includes('execution reverted') || rawMessage.includes('revert')) {
    // Extract revert reason if available (e.g. "execution reverted: contract specific message")
    const revertMatch = rawMessage.match(/execution reverted:\s*(.*)/);
    const reason = revertMatch ? revertMatch[1] : 'The contract execution conditions were not met.';
    return {
      code: 'CONTRACT_EXECUTION_REVERTED',
      title: 'Smart Contract Reverted',
      description: `The transaction was rejected by the blockchain smart contract. Reason: "${reason}"`,
      badge: 'Execution Reverted',
      severity: 'error',
    };
  }

  // 5. Auth / Validation
  if (rawMessage.includes('unauthorized') || rawMessage.includes('invalid credentials') || rawCode === 401 || rawCode === 403) {
    return {
      code: 'AUTH_SESSION_EXPIRED',
      title: 'Session Expired',
      description: 'Your current session has expired. Please log in again to renew your security tokens.',
      badge: 'Authentication Fail',
      severity: 'critical',
    };
  }

  if (rawMessage.includes('invalid address') || rawMessage.includes('bad address') || rawMessage.includes('invalid recipient')) {
    return {
      code: 'VALIDATION_ADDRESS_INVALID',
      title: 'Invalid Wallet Address',
      description: 'The recipient address is invalid. Please double check that you have copied the correct destination address.',
      badge: 'Validation Fail',
      severity: 'warning',
    };
  }

  // Fallback for everything else
  return {
    code: 'UNKNOWN_SYSTEM_ERROR',
    title: 'Unexpected Execution Error',
    description: error.message || 'An unexpected error occurred during execution. Please verify your transaction history on Arcscan.',
    badge: 'System Failure',
    severity: 'error',
  };
}
