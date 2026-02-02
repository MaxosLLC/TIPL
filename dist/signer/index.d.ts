import { SignerConfig, BaseSigner } from './types';
export { LocalSigner } from './local';
export { LedgerSigner } from './ledger';
export * from './types';
export declare function createSigner(config: SignerConfig): BaseSigner;
