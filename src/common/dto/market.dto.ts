import { ApiProperty } from '@nestjs/swagger';
import { SupportedChain } from '../types/chain.type';

export class MarketRewardDto {
  @ApiProperty({
    description: 'Reward token address',
    example: '0x1234...',
  })
  rewardToken: string;

  @ApiProperty({
    description: 'Reward token symbol',
    example: 'MORPHO',
  })
  rewardSymbol: string;

  @ApiProperty({
    description: 'Supply APR for the reward',
    example: '0.1',
  })
  supplyApr: string;

  @ApiProperty({
    description: 'Borrow APR for the reward',
    example: '0.05',
  })
  borrowApr: string;
}

export class MarketAssetDto {
  @ApiProperty({
    description: 'Asset symbol',
    example: 'WETH',
  })
  underlyingSymbol: string;

  @ApiProperty({
    description: 'Total supply in native units',
    example: '1000000000000000000',
  })
  totalSupply: string;

  @ApiProperty({
    description: 'Total supply in USD',
    example: '1500.5',
  })
  totalSupplyUsd: string;

  @ApiProperty({
    description: 'Total borrow in native units',
    example: '500000000000000000',
  })
  totalBorrow: string;

  @ApiProperty({
    description: 'Total borrow in USD',
    example: '750.25',
  })
  totalBorrowUsd: string;

  @ApiProperty({
    description: 'Available liquidity in native units',
    example: '500000000000000000',
  })
  liquidity: string;

  @ApiProperty({
    description: 'Available liquidity in USD',
    example: '750.25',
  })
  liquidityUsd: string;

  @ApiProperty({
    description: 'Supply APY',
    example: '0.05',
  })
  supplyApy: string;

  @ApiProperty({
    description: 'Borrow APY',
    example: '0.08',
  })
  borrowApy: string;

  @ApiProperty({
    description: 'Is collateral',
    example: true,
  })
  isCollateral: boolean;

  @ApiProperty({
    description: 'Loan to value ratio',
    example: '0.8',
  })
  ltv: string;

  @ApiProperty({
    description: 'Reward APRs',
    type: [MarketRewardDto],
  })
  rewards: MarketRewardDto[];
}

export class MarketPoolDto {
  @ApiProperty({
    description: 'Pool name',
    example: 'WETH/USDC',
  })
  name: string;

  @ApiProperty({
    description: 'Pool ID',
    example: '0x123...',
  })
  poolId: string;

  @ApiProperty({
    description: 'Total value locked in USD',
    example: 1000000,
  })
  totalValueUsd: number;

  @ApiProperty({
    description: 'Market assets',
    type: [MarketAssetDto],
  })
  assets: MarketAssetDto[];
}

export class ProtocolPoolsDto {
  @ApiProperty({
    description: 'Protocol name',
    example: 'ionic',
    enum: ['ionic', 'morpho'],
  })
  protocol: string;

  @ApiProperty({
    description: 'List of pools',
    type: [MarketPoolDto],
  })
  pools: MarketPoolDto[];
}

export class ChainMarketsDto {
  @ApiProperty({
    description: 'Chain name',
    example: 'base',
  })
  chain: SupportedChain;

  @ApiProperty({
    description: 'List of protocols',
    type: [ProtocolPoolsDto],
  })
  protocols: ProtocolPoolsDto[];
}

export class AggregatedMarketsResponseDto {
  @ApiProperty({
    description: 'List of chains',
    type: [ChainMarketsDto],
  })
  chains: ChainMarketsDto[];
}
