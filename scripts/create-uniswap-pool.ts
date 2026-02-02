/**
 * Create/initialize Uniswap V4 pool for token/USDC pair
 *
 * Arguments: --token 0x... [--price 0.01]
 *
 * This script:
 * 1. Calculates the pool ID for token/USDC pair
 * 2. Checks if pool exists
 * 3. Initializes pool if it doesn't exist (at specified starting price)
 * 4. Outputs pool ID for use by mint-pool-position script
 *
 * Run: npm run create-uniswap-pool -- --token 0x... --price 0.001
 * Output: { poolId: "0x...", currency0: "0x...", currency1: "0x...", isTokenCurrency0: true/false }
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { POOL_MANAGER, USDC, BASE_CHAIN_ID, STATE_VIEW } from '../src/constants/addresses';

// Pool configuration
const FEE = 10000; // 1.00%
const TICK_SPACING = 200; // Standard tick spacing for 1% fee tier
const HOOKS = '0x0000000000000000000000000000000000000000'; // No hooks

// PoolManager ABI (minimal)
const POOL_MANAGER_ABI = [
  'function initialize((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)',
];

// StateView ABI for checking pool state
const STATE_VIEW_ABI = [
  'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
];

// Default starting price in USDC per token
const DEFAULT_PRICE = 0.01;

// Parse command line arguments
function parseArgs(): { token: string; price: number } {
  const args = process.argv.slice(2);
  let token = '';
  let price = DEFAULT_PRICE;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      token = args[++i];
    } else if (args[i] === '--price' && args[i + 1]) {
      price = parseFloat(args[++i]);
      if (isNaN(price) || price <= 0) {
        console.error('Error: Invalid price. Must be a positive number.');
        process.exit(1);
      }
    }
  }

  if (!token) {
    console.error('Usage: npm run create-uniswap-pool -- --token 0x... [--price 0.01]');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(token)) {
    console.error('Error: Invalid token address format');
    process.exit(1);
  }

  return { token, price };
}

// Calculate sqrtPriceX96 from a price
function priceToSqrtPriceX96(price: number): bigint {
  const sqrtPrice = Math.sqrt(price);
  const Q96 = BigInt(2) ** BigInt(96);
  return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

// Calculate tick from price
function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

async function main() {
  const { token, price } = parseArgs();

  const signerType = process.env.SIGNER_TYPE as 'local' | 'ledger';
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

  if (!signerType) {
    console.error('Error: SIGNER_TYPE not set in .env file');
    process.exit(1);
  }

  const config: SignerConfig = {
    type: signerType,
    rpcUrl,
    privateKey: process.env.PRIVATE_KEY,
    derivationPath: process.env.DERIVATION_PATH,
  };

  console.log(`Using ${signerType} signer...`);
  console.log(`Token: ${token}`);
  console.log(`Starting price: ${price} USDC per token`);

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const deployerAddress = await signer.getAddress();
    const provider = signer.getProvider();
    console.log(`Deployer: ${deployerAddress}`);

    // Sort tokens to determine currency0/currency1 (V4 requires sorting)
    const [currency0, currency1] = token.toLowerCase() < USDC.toLowerCase()
      ? [token, USDC]
      : [USDC, token];

    const isTokenCurrency0 = currency0.toLowerCase() === token.toLowerCase();
    console.log(`\nCurrency0: ${currency0} ${isTokenCurrency0 ? '(token)' : '(USDC)'}`);
    console.log(`Currency1: ${currency1} ${isTokenCurrency0 ? '(USDC)' : '(token)'}`);

    // Calculate pool ID
    const poolKeyTuple = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint24', 'int24', 'address'],
      [currency0, currency1, FEE, TICK_SPACING, HOOKS]
    );
    const poolId = ethers.keccak256(poolKeyTuple);
    console.log(`\nPool ID: ${poolId}`);

    // Check if pool exists
    const stateView = new ethers.Contract(STATE_VIEW, STATE_VIEW_ABI, provider);
    let currentSqrtPriceX96: bigint = 0n;
    let currentTick: number = 0;
    let poolExists = false;

    try {
      const slot0 = await stateView.getSlot0(poolId);
      currentSqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());
      currentTick = Number(slot0.tick);
      if (currentSqrtPriceX96 > 0n) {
        poolExists = true;
        console.log(`\nExisting pool found at tick ${currentTick}`);
      }
    } catch {
      // Pool doesn't exist
    }

    let initTxHash: string | undefined;

    if (!poolExists) {
      console.log('\nPool does not exist, initializing...');

      // Set initial price based on --price parameter (USDC per token)
      // USDC has 6 decimals, token has 18 decimals
      // price (currency1/currency0)
      let initialPrice: number;
      if (isTokenCurrency0) {
        // price = USDC/token with decimal adjustment
        // If user wants 0.001 USDC per token, we adjust for decimals
        initialPrice = price * Math.pow(10, 6 - 18);
      } else {
        // price = token/USDC with decimal adjustment (inverse)
        initialPrice = (1 / price) * Math.pow(10, 18 - 6);
      }

      console.log(`Initial price (adjusted for decimals): ${initialPrice}`);
      currentSqrtPriceX96 = priceToSqrtPriceX96(initialPrice);
      currentTick = priceToTick(initialPrice);
      console.log(`Initial tick: ${currentTick}`);

      const poolManager = new ethers.Contract(POOL_MANAGER, POOL_MANAGER_ABI, provider);
      const initializeData = poolManager.interface.encodeFunctionData('initialize', [
        [currency0, currency1, FEE, TICK_SPACING, HOOKS],
        currentSqrtPriceX96,
      ]);

      console.log('Please confirm the transaction on your Ledger device...');
      const initTx = await signer.sendTransaction({
        to: POOL_MANAGER,
        data: initializeData,
        chainId: BASE_CHAIN_ID,
      });
      await initTx.wait();
      initTxHash = initTx.hash;
      console.log(`Pool initialized: ${initTx.hash}`);
    }

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    // Output JSON result
    const result = {
      poolId,
      currency0,
      currency1,
      isTokenCurrency0,
      fee: FEE,
      tickSpacing: TICK_SPACING,
      hooks: HOOKS,
      currentTick,
      startingPriceUSDC: poolExists ? undefined : price,
      poolExisted: poolExists,
      ...(initTxHash && { initializeTx: initTxHash }),
    };

    console.log('\n' + JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
