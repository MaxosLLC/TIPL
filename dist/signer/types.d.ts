import { ethers } from 'ethers';
export interface SignerConfig {
    type: 'local' | 'ledger';
    rpcUrl: string;
    privateKey?: string;
    derivationPath?: string;
}
export interface TransactionRequest {
    to?: string;
    value?: bigint;
    data?: string;
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
    chainId?: number;
}
export interface SignedTransaction {
    rawTransaction: string;
    hash: string;
}
export interface BaseSigner {
    getAddress(): Promise<string>;
    signTransaction(tx: TransactionRequest): Promise<SignedTransaction>;
    sendTransaction(tx: TransactionRequest): Promise<ethers.TransactionResponse>;
    getProvider(): ethers.JsonRpcProvider;
}
