// External dependencies
import { ApiProperty } from '@nestjs/swagger';

// Types
import { SupportedChain } from '../types/chain.type';

export class AssetDto {
  @ApiProperty({
    description: 'Asset symbol',
    example: 'WETH',
  })
  asset: string;

  @ApiProperty({
    description: 'Supply balance in native units',
    example: '1.5',
  })
  supplyBalance: string;

  @ApiProperty({
    description: 'Supply balance in USD',
    example: 1500.5,
  })
  supplyBalanceUsd: number;

  @ApiProperty({
    description: 'Borrow balance in native units',
    example: '0.5',
  })
  borrowBalance: string;

  @ApiProperty({
    description: 'Borrow balance in USD',
    example: 750.25,
  })
  borrowBalanceUsd: number;
}

export class PoolDto {
  @ApiProperty({
    description: 'Pool name',
    example: 'WETH',
  })
  name: string;

  @ApiProperty({
    description: 'Pool ID',
    example: '0x123',
  })
  poolId: string;

  @ApiProperty({
    description: 'Detailed assets',
    type: [AssetDto],
  })
  assets: AssetDto[];

  @ApiProperty({
    description: 'Health factor',
    example: '1.5',
  })
  healthFactor: string;
}

export class ProtocolPositionDto {
  @ApiProperty({
    description: 'Protocol name',
    example: 'Ionic',
    enum: ['Ionic', 'Morpho'],
  })
  protocol: string;

  @ApiProperty({
    description: 'Total supply value in USD',
    example: 1500.5,
  })
  totalSupplyUsd: number;

  @ApiProperty({
    description: 'Total borrow value in USD',
    example: 750.25,
  })
  totalBorrowUsd: number;

  @ApiProperty({
    description: 'Net value in USD (supply - borrow)',
    example: 750.25,
  })
  netValueUsd: number;

  @ApiProperty({
    description: 'Detailed positions',
    type: [PoolDto],
  })
  pools: PoolDto[];
}

export class ChainPositionsDto {
  @ApiProperty({
    description: 'Chain name',
    example: 'Base',
  })
  chain: SupportedChain;

  @ApiProperty({
    description: 'Total value in USD for this chain',
    example: 2250.75,
  })
  totalValueUsd: number;

  @ApiProperty({
    description: 'Total supply in USD for this chain',
    example: 3000.0,
  })
  totalSupplyUsd: number;

  @ApiProperty({
    description: 'Total borrow in USD for this chain',
    example: 750.25,
  })
  totalBorrowUsd: number;

  @ApiProperty({
    description: 'Positions by protocol',
    type: [ProtocolPositionDto],
  })
  protocols: ProtocolPositionDto[];
}

export class PositionsResponseDto {
  @ApiProperty({
    description: 'Total value in USD across all chains and protocols',
    example: 2250.75,
  })
  totalValueUsd: number;

  @ApiProperty({
    description: 'Total supply value in USD across all chains and protocols',
    example: 3000.0,
  })
  totalSupplyUsd: number;

  @ApiProperty({
    description: 'Total borrow value in USD across all chains and protocols',
    example: 1500.5,
  })
  totalBorrowUsd: number;

  @ApiProperty({
    description: 'Positions by chain',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/ChainPositionsDto',
    },
    example: {
      chains: [
        {
          chain: 'Base',
          totalValueUsd: 1500.5,
          totalSupplyUsd: 2000.0,
          totalBorrowUsd: 500.5,
          protocols: [
            {
              protocol: 'Ionic',
              totalSupplyUsd: 1500.5,
              totalBorrowUsd: 500.5,
              netValueUsd: 1000.0,
              pools: [
                {
                  name: 'Base Main Pool',
                  poolId: '0x123',
                  assets: [
                    {
                      asset: 'WETH',
                      supplyBalance: '1.5',
                      supplyBalanceUsd: 1500.5,
                      borrowBalance: '0.5',
                      borrowBalanceUsd: 500.5,
                    },
                  ],
                  healthFactor: '1.5',
                },
              ],
            },
          ],
        },
      ],
    },
  })
  chains: ChainPositionsDto[];
}
