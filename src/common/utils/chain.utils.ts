import { Chain as ViemChain, base, mode, mainnet } from 'viem/chains';
import { SupportedChain } from '../types/chain.type';

export const CHAIN_CONFIGS: Record<SupportedChain, ViemChain> = {
  base,
  mode,
  mainnet,
  // Add other chain configs as needed
};

export function getChainConfig(chain: SupportedChain): ViemChain {
  const config = CHAIN_CONFIGS[chain];
  if (!config) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return config;
}

export function getChainId(chain: SupportedChain): number {
  return getChainConfig(chain).id;
}
