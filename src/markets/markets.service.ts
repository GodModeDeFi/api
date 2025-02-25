import { Injectable } from '@nestjs/common';
import { IonicService } from '../ionic/ionic.service';
import { MorphoService } from '../morpho/morpho.service';
import { Protocol } from '../positions/positions.controller';
import {
  AggregatedMarketsResponseDto,
  ChainMarketsDto,
  ProtocolPoolsDto,
} from '../common/dto/market.dto';
import { MarketSearchQueryDto } from '../common/dto/market-search.dto';
import { AaveService } from '../aave/aave.service';
import { Chain } from '../common/types/chain.type';

const SUPPORTED_CHAINS = ['base', 'mode'] as const;
import { SUPPORTED_CHAINS, SupportedChain } from '../common/types/chain.type';

@Injectable()
export class MarketsService {
  constructor(
    private readonly ionicService: IonicService,
    private readonly morphoService: MorphoService,
    private readonly aaveService: AaveService,
  ) {}

  private readonly protocolHandlers: Record<
    Protocol,
    (query: MarketSearchQueryDto) => Promise<ProtocolPoolsDto>
  > = {
    ionic: (query) => this.getIonicMarkets(query),
    morpho: (query) => this.getMorphoMarkets(query),
    aave: (query) => this.getAaveMarkets(query),
  };

  private async getIonicMarkets(
    query: MarketSearchQueryDto,
  ): Promise<ProtocolPoolsDto> {
    return this.ionicService.getMarketInfo(query);
  }

  private async getMorphoMarkets(
    query: MarketSearchQueryDto,
  ): Promise<ProtocolPoolsDto> {
    return this.morphoService.getMarketInfo(query);
  }

  private async getAaveMarkets(
    query: MarketSearchQueryDto,
  ): Promise<ProtocolPoolsDto> {
    const marketInfo = await this.aaveService.getMarketInfo(query.chain as Chain);

    // Transform string values to numbers
    const transformedPools = marketInfo.pools.map(pool => ({
      ...pool,
      totalValueUsd: Number(pool.totalValueUsd),
      assets: pool.assets.map(asset => ({
        ...asset,
        totalSupplyUsd: Number(asset.totalSupplyUsd),
        totalBorrowUsd: Number(asset.totalBorrowUsd),
        liquidityUsd: Number(asset.liquidityUsd)
      }))
    }));

    return {
      ...marketInfo,
      pools: transformedPools.map(pool => ({
        ...pool,
        totalValueUsd: pool.totalValueUsd,
        assets: pool.assets.map(asset => ({
          ...asset,
          totalSupplyUsd: asset.totalSupplyUsd.toString(),
          totalBorrowUsd: asset.totalBorrowUsd.toString(), 
          liquidityUsd: asset.liquidityUsd.toString(),
          rewards: []
        }))
      }))
    };
  }

  async getAllMarkets(
    query: MarketSearchQueryDto,
  ): Promise<AggregatedMarketsResponseDto> {
    const chainsToQuery = query.chain ? [query.chain] : SUPPORTED_CHAINS;
    const protocolsToQuery = query.protocol
      ? [query.protocol]
      : (Object.keys(this.protocolHandlers) as Protocol[]);

    const chainPromises = chainsToQuery.map(
      async (chain: SupportedChain): Promise<ChainMarketsDto> => {
        const chainQuery = { ...query, chain };
        const protocolPromises = protocolsToQuery.map((protocol) =>
          this.protocolHandlers[protocol](chainQuery).catch(() => ({
            protocol,
            totalValueUsd: 0,
            pools: [],
          })),
        );

        const protocols = (await Promise.all(protocolPromises)).filter(
          (result) => result.pools.length > 0,
        );

        return {
          chain,
          protocols,
        };
      },
    );

    const chains = (await Promise.all(chainPromises)).filter(
      (chain) => chain.protocols.length > 0,
    );

    return { chains };
  }
}
