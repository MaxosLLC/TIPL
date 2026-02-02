/**
 * Display Safe.global app URL for a treasury address
 *
 * Run: npm run view-treasury <safe-address>
 */

const safeAddress = process.argv[2];

if (!safeAddress) {
  console.error('Usage: npm run view-treasury <safe-address>');
  process.exit(1);
}

if (!/^0x[a-fA-F0-9]{40}$/.test(safeAddress)) {
  console.error('Error: Invalid Ethereum address format');
  process.exit(1);
}

const safeUrl = `https://app.safe.global/home?safe=base:${safeAddress}`;

console.log(`Treasury URL: ${safeUrl}`);
