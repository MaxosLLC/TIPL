/**
 * Get the wallet address from configured signer (local or Ledger)
 * Run: npx ts-node scripts/get-address.ts
 */

import 'dotenv/config';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';

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
    console.log(`Address: ${address}`);

    // Get balance
    const provider = signer.getProvider();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
    console.log(`Balance: ${balance.toString()} wei`);

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
