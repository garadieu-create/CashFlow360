export const CASHFLOW_VAULT_ADDRESS = '0x8704caa872Ac721e648DBeB9Fd6FA46C396d6Aad' as const;

export const CASHFLOW_VAULT_ABI = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'category', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'batchTransfer',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'categories', type: 'string[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setAlertThreshold',
    inputs: [{ name: 'threshold', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'lowBalanceThreshold',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVaultBalance',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTransactionCount',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserTransactionIds',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalTransactions',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTransaction',
    inputs: [{ name: 'txId', type: 'uint256' }],
    outputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'category', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'txType', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Transferred',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'category', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BatchTransferred',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'recipientCount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AlertThresholdSet',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'threshold', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'LowBalanceAlert',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'balance', type: 'uint256', indexed: false },
      { name: 'threshold', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'setCoSigner',
    inputs: [{ name: '_coSigner', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveAndExecuteRequest',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getMultiSigRequestsCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'multiSigRequests',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'category', type: 'string' },
      { name: 'executed', type: 'bool' },
      { name: 'ownerApproved', type: 'bool' },
      { name: 'coSignerApproved', type: 'bool' }
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'MultiSigRequestCreated',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'category', type: 'string', indexed: false }
    ],
  },
  {
    type: 'event',
    name: 'MultiSigRequestApproved',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'approver', type: 'address', indexed: true }
    ],
  },
  {
    type: 'event',
    name: 'MultiSigRequestExecuted',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'executor', type: 'address', indexed: true }
    ],
  },
] as const;

export const USDC_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

export const PAYROLL_JOB_ADDRESS = '0xdF35E1700Ec6a735160E360eB73Cb5779cCeC66A' as const;

export const PAYROLL_JOB_ABI = [
  {
    type: 'function',
    name: 'createJob',
    inputs: [
      { name: 'contractor', type: 'address' },
      { name: 'paymentAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'fundJob',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'releasePayment',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'disputeJob',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getJobsCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getJobs',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'client', type: 'address' },
          { name: 'contractor', type: 'address' },
          { name: 'paymentAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const;
