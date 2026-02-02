import { ethers } from 'ethers';
import { BaseSigner, TransactionRequest, SignedTransaction } from './types';

export class LocalSigner implements BaseSigner {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor(privateKey: string, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async getAddress(): Promise<string> {
    return this.wallet.address;
  }

  async signTransaction(tx: TransactionRequest): Promise<SignedTransaction> {
    const populatedTx = await this.wallet.populateTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      gasLimit: tx.gasLimit,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: tx.chainId,
    });

    const rawTransaction = await this.wallet.signTransaction(populatedTx);
    const hash = ethers.keccak256(rawTransaction);

    return { rawTransaction, hash };
  }

  async sendTransaction(tx: TransactionRequest): Promise<ethers.TransactionResponse> {
    return this.wallet.sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      gasLimit: tx.gasLimit,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: tx.chainId,
    });
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  // Generate a new random wallet
  static generateWallet(): { address: string; privateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }
}
