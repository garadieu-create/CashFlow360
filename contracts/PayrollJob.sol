// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayrollJob
 * @notice ERC-8183 Job protocol implementation for contractor payroll escrow
 * @dev Manages job-based escrows in USDC. Client creates and funds jobs, releasing payments upon completion.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PayrollJob {
    address public owner;
    IERC20 public immutable usdc;

    enum JobStatus { CREATED, FUNDED, SETTLED, DISPUTED }

    struct Job {
        uint256 id;
        address client;
        address contractor;
        uint256 paymentAmount;
        JobStatus status;
        uint256 createdAt;
    }

    Job[] public jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed contractor, uint256 paymentAmount);
    event JobFunded(uint256 indexed jobId, address indexed client, uint256 amount);
    event JobSettled(uint256 indexed jobId, address indexed contractor, uint256 amount);
    event JobDisputed(uint256 indexed jobId, address indexed initiator);

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Create a new payroll job
     */
    function createJob(address contractor, uint256 paymentAmount) external returns (uint256) {
        require(contractor != address(0), "Invalid contractor address");
        require(paymentAmount > 0, "Payment amount must be positive");

        uint256 jobId = jobs.length;
        jobs.push(Job({
            id: jobId,
            client: msg.sender,
            contractor: contractor,
            paymentAmount: paymentAmount,
            status: JobStatus.CREATED,
            createdAt: block.timestamp
        }));

        emit JobCreated(jobId, msg.sender, contractor, paymentAmount);
        return jobId;
    }

    /**
     * @notice Fund a job escrow (USDC transferred from client into contract)
     */
    function fundJob(uint256 jobId) external {
        require(jobId < jobs.length, "Job does not exist");
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.CREATED, "Job not in CREATED status");
        require(msg.sender == job.client, "Only client can fund");

        require(usdc.transferFrom(msg.sender, address(this), job.paymentAmount), "USDC transfer failed");
        job.status = JobStatus.FUNDED;

        emit JobFunded(jobId, msg.sender, job.paymentAmount);
    }

    /**
     * @notice Release escrow funds to contractor
     */
    function releasePayment(uint256 jobId) external {
        require(jobId < jobs.length, "Job does not exist");
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.FUNDED, "Job not funded");
        require(msg.sender == job.client || msg.sender == owner, "Only client or owner can release");

        job.status = JobStatus.SETTLED;
        require(usdc.transfer(job.contractor, job.paymentAmount), "USDC transfer failed");

        emit JobSettled(jobId, job.contractor, job.paymentAmount);
    }

    /**
     * @notice Dispute a job payment
     */
    function disputeJob(uint256 jobId) external {
        require(jobId < jobs.length, "Job does not exist");
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.FUNDED, "Job not in FUNDED status");
        require(msg.sender == job.client || msg.sender == job.contractor, "Only participant can dispute");

        job.status = JobStatus.DISPUTED;
        emit JobDisputed(jobId, msg.sender);
    }

    /**
     * @notice Resolve a dispute in favor of either client or contractor
     * @param jobId ID of the job
     * @param resolveToContractor True to release payment to contractor, false to refund client
     */
    function resolveDispute(uint256 jobId, bool resolveToContractor) external {
        require(msg.sender == owner, "Only owner can resolve disputes");
        require(jobId < jobs.length, "Job does not exist");
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.DISPUTED, "Job not in DISPUTED status");

        job.status = JobStatus.SETTLED;

        if (resolveToContractor) {
            require(usdc.transfer(job.contractor, job.paymentAmount), "USDC transfer failed");
            emit JobSettled(jobId, job.contractor, job.paymentAmount);
        } else {
            require(usdc.transfer(job.client, job.paymentAmount), "USDC transfer failed");
            emit JobSettled(jobId, job.client, job.paymentAmount);
        }
    }

    function getJobsCount() external view returns (uint256) {
        return jobs.length;
    }

    function getJobs() external view returns (Job[] memory) {
        return jobs;
    }
}
