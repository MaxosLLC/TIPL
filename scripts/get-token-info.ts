/**
 * Get token information from blockchain
 *
 * Reads TOKEN_ADDRESS from .env and queries the ERC20 contract for its symbol.
 * Outputs JSON with token address, symbol, and blockchain.
 *
 * Run: npm run get-token-info
 * Output: { "address": "0x...", "symbol": "TKN", "blockchain": "Base" }
 */

import 'dotenv/config';
import { ethers } from 'ethers';

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

  if (!tokenAddress) {
    console.error('Error: TOKEN_ADDRESS not set in .env file');
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    console.error('Error: Invalid TOKEN_ADDRESS format');
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const symbol = await token.symbol();
    const name = await token.name();

    const result = {
      address: tokenAddress,
      symbol,
      name,
      blockchain: 'Base',
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
