// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CashFlowVault
 * @notice SME cash flow management vault for CashFlow360
 * @dev Accepts USDC deposits, tracks categorized transfers, enables batch payments
 * 
 * Circle Products Used:
 * - USDC (native settlement on Arc)
 * - App Kit Send (wallet-to-wallet transfers)
 * - App Kit Bridge (cross-chain treasury management via CCTP)
 * - App Kit Swap (USDC↔EURC FX conversion)
 * - Unified Balance (multi-chain treasury aggregation)
 * - User-Controlled Wallets (RainbowKit wallet connection)
 */

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CashFlowVault {
    address public owner;
    bool private _locked;

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    IERC20 public immutable usdc;

    enum TxType { DEPOSIT, WITHDRAWAL, TRANSFER }

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        string category;
        uint256 timestamp;
        TxType txType;
    }

    // Vault balances per user
    mapping(address => uint256) public vaultBalances;

    // Transaction log
    Transaction[] public transactions;
    mapping(address => uint256[]) public userTransactions;

    // Alert thresholds
    mapping(address => uint256) public lowBalanceThreshold;

    // Events — critical for on-chain analytics indexing
    event Deposited(address indexed from, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount, uint256 timestamp);
    event Transferred(
        address indexed from,
        address indexed to,
        uint256 amount,
        string category,
        uint256 timestamp
    );
    event BatchTransferred(
        address indexed from,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 timestamp
    );
    event AlertThresholdSet(address indexed user, uint256 threshold);
    event LowBalanceAlert(address indexed user, uint256 balance, uint256 threshold);

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Deposit USDC into the vault
     * @param amount Amount of USDC to deposit (6 decimals)
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transferFrom failed");
        vaultBalances[msg.sender] += amount;

        uint256 txId = transactions.length;
        transactions.push(Transaction({
            from: msg.sender,
            to: address(this),
            amount: amount,
            category: "Deposit",
            timestamp: block.timestamp,
            txType: TxType.DEPOSIT
        }));
        userTransactions[msg.sender].push(txId);

        emit Deposited(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Withdraw USDC from the vault
     * @param amount Amount of USDC to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(vaultBalances[msg.sender] >= amount, "Insufficient balance");

        vaultBalances[msg.sender] -= amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");

        uint256 txId = transactions.length;
        transactions.push(Transaction({
            from: address(this),
            to: msg.sender,
            amount: amount,
            category: "Withdrawal",
            timestamp: block.timestamp,
            txType: TxType.WITHDRAWAL
        }));
        userTransactions[msg.sender].push(txId);

        emit Withdrawn(msg.sender, amount, block.timestamp);

        // Check low balance alert
        _checkLowBalance(msg.sender);
    }

    /**
     * @notice Transfer USDC to another address with category tagging
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param category Transaction category (e.g., "Payroll", "Supplier", "Rent")
     */
    function transfer(
        address to,
        uint256 amount,
        string calldata category
    ) external nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(vaultBalances[msg.sender] >= amount, "Insufficient balance");

        vaultBalances[msg.sender] -= amount;
        require(usdc.transfer(to, amount), "USDC transfer failed");

        uint256 txId = transactions.length;
        transactions.push(Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            category: category,
            timestamp: block.timestamp,
            txType: TxType.TRANSFER
        }));
        userTransactions[msg.sender].push(txId);

        emit Transferred(msg.sender, to, amount, category, block.timestamp);

        _checkLowBalance(msg.sender);
    }

    /**
     * @notice Batch transfer to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     * @param categories Array of categories
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata categories
    ) external nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == categories.length, "Length mismatch");
        require(recipients.length > 0, "Empty batch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(vaultBalances[msg.sender] >= totalAmount, "Insufficient balance");

        vaultBalances[msg.sender] -= totalAmount;

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(usdc.transfer(recipients[i], amounts[i]), "USDC transfer failed");

            uint256 txId = transactions.length;
            transactions.push(Transaction({
                from: msg.sender,
                to: recipients[i],
                amount: amounts[i],
                category: categories[i],
                timestamp: block.timestamp,
                txType: TxType.TRANSFER
            }));
            userTransactions[msg.sender].push(txId);

            emit Transferred(msg.sender, recipients[i], amounts[i], categories[i], block.timestamp);
        }

        emit BatchTransferred(msg.sender, totalAmount, recipients.length, block.timestamp);

        _checkLowBalance(msg.sender);
    }

    /**
     * @notice Set low balance alert threshold
     * @param threshold USDC amount threshold (6 decimals)
     */
    function setAlertThreshold(uint256 threshold) external {
        lowBalanceThreshold[msg.sender] = threshold;
        emit AlertThresholdSet(msg.sender, threshold);
    }

    // === View Functions ===

    function getVaultBalance(address owner) external view returns (uint256) {
        return vaultBalances[owner];
    }

    function getTransactionCount(address owner) external view returns (uint256) {
        return userTransactions[owner].length;
    }

    function getTransaction(uint256 txId) external view returns (
        address from,
        address to,
        uint256 amount,
        string memory category,
        uint256 timestamp,
        TxType txType
    ) {
        Transaction storage txn = transactions[txId];
        return (txn.from, txn.to, txn.amount, txn.category, txn.timestamp, txn.txType);
    }

    function getUserTransactionIds(address owner) external view returns (uint256[] memory) {
        return userTransactions[owner];
    }

    function getTotalTransactions() external view returns (uint256) {
        return transactions.length;
    }

    // === Internal ===

    function _checkLowBalance(address user) internal {
        uint256 threshold = lowBalanceThreshold[user];
        if (threshold > 0 && vaultBalances[user] < threshold) {
            emit LowBalanceAlert(user, vaultBalances[user], threshold);
        }
    }
}
