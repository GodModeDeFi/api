export const SUPPORTED_CHAINS = ['base', 'mode', 'mainnet'] as const;
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];
