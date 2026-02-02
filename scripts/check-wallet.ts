/**
 * Verify wallet has sufficient ETH for token creation
 * Requires at least 0.001 ETH
 *
 * Run: npm run check-wallet
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';

const MIN_BALANCE = ethers.parseEther('0.001');

async function main() {
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

  if (signerType === 'ledger') {
    console.log('Please connect your Ledger, unlock it, and open the Ethereum app.');
  }

  const signer = createSigner(config);

  try {
    const address = await signer.getAddress();
    const provider = signer.getProvider();
    const balance = await provider.getBalance(address);

    console.log(`Address: ${address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    if (balance < MIN_BALANCE) {
      console.error(`\nInsufficient balance. Need at least ${ethers.formatEther(MIN_BALANCE)} ETH.`);
      process.exit(1);
    }

    console.log('\nWallet check passed. Sufficient balance for token creation.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
