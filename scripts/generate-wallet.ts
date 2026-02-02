/**
 * Generate a new random wallet for local signing
 * Run: npx ts-node scripts/generate-wallet.ts
 */

import { LocalSigner } from '../src/signer';

const wallet = LocalSigner.generateWallet();

console.log('New Wallet Generated');
console.log('====================');
console.log(`Address:     ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log('');
console.log('IMPORTANT: Save your private key securely. Never share it or commit it to git.');
console.log('Add the private key (without 0x prefix) to your .env file as PRIVATE_KEY.');
