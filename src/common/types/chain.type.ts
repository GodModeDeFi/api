export const SUPPORTED_CHAINS = ['base', 'mode'] as const;
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];
