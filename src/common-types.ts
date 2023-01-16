import { ethers } from 'ethers';

export type UnsignedTransaction = ethers.providers.TransactionRequest;
export type CallOverrides = ethers.CallOverrides;
export type BigNumberish = ethers.BigNumberish;

export type Address = string;

export interface HasAddress {
    address: Address;
}

export type Addressable = Address | HasAddress;
