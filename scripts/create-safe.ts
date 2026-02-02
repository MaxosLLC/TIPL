/**
 * Deploy a new Safe.global 1-of-1 multisig treasury
 * Owner = current signing wallet
 *
 * Run: npm run create-safe
 * Output: { safeAddress: "0x..." }
 */

import 'dotenv/config';
import Safe, { PredictedSafeProps, SafeAccountConfig } from '@safe-global/protocol-kit';
import { createSigner, SignerConfig, LedgerSigner } from '../src/signer';
import { BASE_CHAIN_ID } from '../src/constants/addresses';

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
    const ownerAddress = await signer.getAddress();
    console.log(`Owner address: ${ownerAddress}`);

    // Configure 1-of-1 multisig with owner as the signer
    const safeAccountConfig: SafeAccountConfig = {
      owners: [ownerAddress],
      threshold: 1,
    };

    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig,
    };

    // Initialize Protocol Kit with predicted Safe
    // For local signer, pass private key; for Ledger, we'll need to handle differently
    let protocolKit: Safe;

    if (signerType === 'local') {
      protocolKit = await Safe.init({
        provider: rpcUrl,
        signer: process.env.PRIVATE_KEY,
        predictedSafe,
      });
    } else {
      // For Ledger, we need to use a different approach
      // The protocol kit supports passing an address as signer
      protocolKit = await Safe.init({
        provider: rpcUrl,
        signer: ownerAddress,
        predictedSafe,
      });
    }

    // Get predicted Safe address
    const safeAddress = await protocolKit.getAddress();
    console.log(`Predicted Safe address: ${safeAddress}`);

    // Create deployment transaction
    const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
    console.log('Deploying Safe...');

    // Send the transaction using our signer
    const txResponse = await signer.sendTransaction({
      to: deploymentTransaction.to,
      value: BigInt(deploymentTransaction.value),
      data: deploymentTransaction.data as string,
      chainId: BASE_CHAIN_ID,
    });

    console.log(`Transaction hash: ${txResponse.hash}`);
    console.log('Waiting for confirmation...');

    const receipt = await txResponse.wait();
    console.log(`Safe deployed in block ${receipt?.blockNumber}`);

    // Verify deployment
    const newProtocolKit = await protocolKit.connect({ safeAddress });
    const isSafeDeployed = await newProtocolKit.isSafeDeployed();

    if (!isSafeDeployed) {
      throw new Error('Safe deployment verification failed');
    }

    // Disconnect Ledger if used
    if (signer instanceof LedgerSigner) {
      await signer.disconnect();
    }

    // Output JSON result
    console.log(JSON.stringify({ safeAddress }, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
