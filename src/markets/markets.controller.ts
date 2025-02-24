import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

import { MarketsService } from './markets.service';
import { MarketSearchQueryDto } from '../common/dto/market-search.dto';
import { AggregatedMarketsResponseDto } from '../common/dto/market.dto';
import { PROTOCOLS } from '../positions/positions.controller';

@ApiTags('markets')
@Controller('beta/v0/markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get market information across all protocols or for a specific protocol',
    description: `
Returns market information filtered by optional chain, protocol, and asset parameters.
- If protocol is specified, returns markets for that protocol only
- If chain is specified, returns markets for that chain only
- If asset is specified, returns markets matching the asset symbol (case-insensitive)
- If no filters are specified, returns all markets across all protocols
- Empty markets and protocols with no markets are filtered out
    `,
  })
  @ApiQuery({
    name: 'protocol',
    required: false,
    description: 'Filter markets by protocol',
    enum: PROTOCOLS,
    example: 'ionic',
  })
  @ApiQuery({
    name: 'chain',
    required: false,
    description: 'Filter markets by chain',
    enum: ['base', 'mode', 'mainnet'],
    example: 'base',
  })
  @ApiQuery({
    name: 'asset',
    required: false,
    description:
      'Filter markets by asset symbol (case-insensitive partial match)',
    example: 'ETH',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the market information',
    type: AggregatedMarketsResponseDto,
    schema: {
      example: {
        chains: [
          {
            chain: 'base',
            totalValueUsd: 1250000,
            protocols: [
              {
                protocol: 'ionic',
                totalValueUsd: 750000,
                pools: [
                  {
                    name: 'WETH Pool',
                    poolId: '0x123...',
                    totalValueUsd: 500000,
                    assets: [
                      {
                        underlyingSymbol: 'WETH',
                        totalSupply: '1000000000000000000',
                        totalSupplyUsd: '1500.5',
                        totalBorrow: '500000000000000000',
                        totalBorrowUsd: '750.25',
                        liquidity: '500000000000000000',
                        liquidityUsd: '750.25',
                        supplyApy: '0.05',
                        borrowApy: '0.08',
                        isCollateral: true,
                        ltv: '0.8',
                        rewards: [
                          {
                            rewardToken: '0x456...',
                            rewardSymbol: 'IONIC',
                            supplyApr: '0.1',
                            borrowApr: '0.05',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  })
  async getMarkets(
    @Query() query: MarketSearchQueryDto,
  ): Promise<AggregatedMarketsResponseDto> {
    const markets = await this.marketsService.getAllMarkets(query);
    return markets as AggregatedMarketsResponseDto;
  }
}
