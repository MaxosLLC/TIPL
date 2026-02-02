/**
 * Send ETH to an address (for testing transaction signing)
 * Run: npx ts-node scripts/send-eth.ts <to-address> <amount-in-eth>
 * Example: npx ts-node scripts/send-eth.ts 0x123...abc 0.001
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';

async function main() {
  const [, , toAddress, amountEth] = process.argv;

  if (!toAddress || !amountEth) {
    console.error('Usage: npx ts-node scripts/send-eth.ts <to-address> <amount-in-eth>');
    console.error('Example: npx ts-node scripts/send-eth.ts 0x123...abc 0.001');
    process.exit(1);
  }

  if (!ethers.isAddress(toAddress)) {
    console.error('Error: Invalid Ethereum address');
    process.exit(1);
  }

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
    const fromAddress = await signer.getAddress();
    const value = ethers.parseEther(amountEth);

    console.log(`From: ${fromAddress}`);
    console.log(`To: ${toAddress}`);
    console.log(`Amount: ${amountEth} ETH`);
    console.log('');
    console.log('Sending transaction...');

    const tx = await signer.sendTransaction({
      to: toAddress,
      value,
    });

    console.log(`Transaction sent!`);
    console.log(`Hash: ${tx.hash}`);
    console.log('');
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log(`Confirmed in block ${receipt?.blockNumber}`);

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
