import { SignerConfig, BaseSigner } from './types';
import { LocalSigner } from './local';
import { LedgerSigner } from './ledger';

export { LocalSigner } from './local';
export { LedgerSigner } from './ledger';
export * from './types';

export function createSigner(config: SignerConfig): BaseSigner {
  switch (config.type) {
    case 'local':
      if (!config.privateKey) {
        throw new Error('Private key is required for local signer');
      }
      return new LocalSigner(config.privateKey, config.rpcUrl);

    case 'ledger':
      return new LedgerSigner(config.rpcUrl, config.derivationPath);

    default:
      throw new Error(`Unknown signer type: ${config.type}`);
  }
}
