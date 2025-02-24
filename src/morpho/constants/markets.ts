import { MarketId } from '@morpho-org/blue-sdk';
import { Address } from 'viem';

export interface MarketInfo {
  marketId: MarketId;
  collateralToken: Address;
  collateralTokenSymbol: string;
  borrowToken: Address;
  borrowTokenSymbol: string;
}
