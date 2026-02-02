---
name: create-token
description: Create and distribute an ERC20 token with optional Uniswap trading pool
disable-model-invocation: true
allowed-tools: Bash(npm run *), Read, Edit, AskUserQuestion
---

# Create Token Skill

This skill automates ERC20 token creation and distribution on Base mainnet, with optional Uniswap V4 pool creation.

## Prerequisites

- A wallet configured in `.env` (local or Ledger)
- At least 0.001 ETH for gas
- `TIPL_TREASURY` address set in `.env`

## Workflow

Follow these steps in order:

### Step 1: Verify Wallet Balance

Run the wallet check script to verify the wallet has sufficient ETH:

```bash
npm run check-wallet
```

**Expected output**: Address and balance, confirmation that balance >= 0.001 ETH

If the balance is insufficient, inform the user and stop.

### Step 2: Create Project Treasury

Deploy a Safe.global 1-of-1 multisig for the project treasury:

```bash
npm run create-safe
```

**Expected output**: JSON with `safeAddress`, or if already deployed, the predicted Safe address.

Save the `safeAddress` for use in later steps.

### Step 2b: Save Project Treasury to .env

Use the Edit tool to save the `safeAddress` as `PROJECT_TREASURY` in the `.env` file:
- If `PROJECT_TREASURY` already exists in `.env`, replace the entire line with the new value
- If `PROJECT_TREASURY` does not exist, add `PROJECT_TREASURY=0x...` as a new line at the end of the file

### Step 3: Get Token Details

Use AskUserQuestion to ask the user to enter:
- **Token name**: The full name of the token (user must provide their own)
- **Token symbol**: The ticker symbol (user must provide their own)

IMPORTANT: Do NOT suggest default names or symbols. The user must enter their own values.

### Step 4: Ask About Uniswap Pool

Use AskUserQuestion to ask if the user wants to create a Uniswap trading pool:
- **Yes**: Reserve 200K tokens for the pool, project treasury gets 750K tokens
- **No**: Project treasury gets 950K tokens (50K always goes to TIPL treasury)

### Step 5: Deploy Token

Deploy the ERC20 token and distribute to treasuries:

If creating a pool:
```bash
npm run deploy-token -- --name "Token Name" --symbol TKN --treasury 0xSafeAddress --pool
```

If NOT creating a pool:
```bash
npm run deploy-token -- --name "Token Name" --symbol TKN --treasury 0xSafeAddress
```

**Expected output**: JSON with `tokenAddress` and `distributions`

Save the `tokenAddress` for use in later steps.

### Step 5b: Save Token Address to .env

Use the Edit tool to save the `tokenAddress` as `TOKEN_ADDRESS` in the `.env` file:
- If `TOKEN_ADDRESS` already exists in `.env`, replace the entire line with the new value
- If `TOKEN_ADDRESS` does not exist, add `TOKEN_ADDRESS=0x...` as a new line at the end of the file

### Step 6: Create Uniswap Pool (Optional)

If the user chose to create a pool in Step 4:

```bash
npm run create-uniswap-pool -- --token 0xTokenAddress
```

**Expected output**: JSON with `poolId`, `currency0`, `currency1`, etc.

Save the `poolId` for use in later steps.

### Step 6b: Save Pool ID to .env (Optional)

If a pool was created, use the Edit tool to save the `poolId` as `UNISWAP_POOL` in the `.env` file:
- If `UNISWAP_POOL` already exists in `.env`, replace the entire line with the new value
- If `UNISWAP_POOL` does not exist, add `UNISWAP_POOL=0x...` as a new line at the end of the file

### Step 6c: Mint Pool Position (Optional)

If a pool was created, mint the LP position and send the LP NFT to the project treasury:

```bash
npm run mint-pool-position -- --token 0xTokenAddress --treasury 0xSafeAddress
```

**Expected output**: JSON with `positionId`, `poolId`, `treasury`, etc.

The LP NFT is automatically sent to the project treasury.

### Step 7: Display Treasury URL

Show the user the Safe.global app URL for managing their treasury:

```bash
npm run view-treasury 0xSafeAddress
```

## Summary

After completing all steps, provide the user with a summary including:
- Token address (link to BaseScan: `https://basescan.org/token/0x...`)
- Token name and symbol
- Distribution breakdown
- Treasury address (link to Safe app)
- Uniswap pool info (if created)

## Token Distribution

| Recipient | Without Pool | With Pool |
|-----------|-------------|-----------|
| TIPL Treasury | 50,000 (5%) | 50,000 (5%) |
| Project Treasury | 950,000 (95%) | 750,000 (75%) |
| Uniswap Pool | - | 200,000 (20%) |
| **Total** | 1,000,000 | 1,000,000 |

## Error Handling

- If any script exits with a non-zero code, stop and report the error to the user
- Common issues:
  - Insufficient ETH balance
  - Invalid TIPL_TREASURY in .env
  - Network connectivity issues
  - Ledger not connected (for hardware wallet users)
