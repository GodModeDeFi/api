// External dependencies
import { Injectable, Logger } from '@nestjs/common';
import { Address, formatEther } from 'viem';

// Services
import { MorphoGraphQLService } from './services/graphql.service';

// DTOs and types
import { MarketPoolDto, ProtocolPoolsDto } from '../common/dto/market.dto';
import { PositionsResponseDto } from '../common/dto/position.dto';

// Constants and utils
import { getChainId } from '../common/utils/chain.utils';
import { MarketSearchQueryDto } from '../common/dto/market-search.dto';
import { SupportedChain, SUPPORTED_CHAINS } from '../common/types/chain.type';

@Injectable()
export class MorphoService {
  private readonly logger = new Logger(MorphoService.name);

  constructor(private readonly graphqlService: MorphoGraphQLService) {}

  async getPositions(
    chain: SupportedChain,
    address: Address,
  ): Promise<PositionsResponseDto> {
    if (!SUPPORTED_CHAINS.includes(chain)) {
      return { positions: { pools: [] } };
    }
    const chainId = getChainId(chain);
    const data = await this.graphqlService.getUserPositions(address, chainId);
    const user = data.userByAddress;

    if (!user || !user.marketPositions) {
      return { positions: { pools: [] } };
    }

    const pools = user.marketPositions.map((position) => {
      return {
        name: `${position.market.collateralAsset.symbol} / ${position.market.loanAsset.symbol}`,
        poolId: position.market.uniqueKey,
        healthFactor: position.healthFactor,
        assets: [
          // collateral
          {
            underlyingSymbol: position.market.collateralAsset.symbol,
            underlyingDecimals: position.market.collateralAsset.decimals,
            supplyBalance: position.collateral,
            supplyBalanceUsd: position.collateralUsd,
            borrowBalance: '0',
            borrowBalanceUsd: '0',
            collateralFactor: position.market.lltv,
            supplyApy: 0,
            borrowApy: 0,
            underlyingPriceUsd: position.market.collateralAsset.priceUsd,
            totalSupply: position.market.state.collateralAssets,
            totalSupplyUsd: position.market.state.collateralAssetsUsd,
            totalBorrow: position.market.state.borrowAssets,
            totalBorrowUsd: position.market.state.borrowAssetsUsd,
            liquidity: position.market.state.liquidityAssets,
            liquidityUsd: position.market.state.liquidityAssetsUsd,
            rewards: position.market.state.rewards.map((reward) => ({
              rewardToken: reward.asset.address,
              rewardSymbol: reward.asset.symbol,
              apy: Number(reward.supplyApr) * 100,
            })),
          },
          // borrow
          {
            underlyingSymbol: position.market.loanAsset.symbol,
            underlyingDecimals: position.market.loanAsset.decimals,
            supplyBalance: '0',
            supplyBalanceUsd: '0',
            borrowBalance: position.borrowAssets,
            borrowBalanceUsd: position.borrowAssetsUsd,
            collateralFactor: position.market.lltv,
            supplyApy: 0,
            borrowApy: Number(position.market.state.borrowApy) * 100,
            underlyingPriceUsd: position.market.loanAsset.priceUsd,
            totalSupply: position.market.state.borrowAssets,
            totalSupplyUsd: position.market.state.borrowAssetsUsd,
            totalBorrow: position.market.state.collateralAssets,
            totalBorrowUsd: position.market.state.collateralAssetsUsd,
            liquidity: position.market.state.liquidityAssets,
            liquidityUsd: position.market.state.liquidityAssetsUsd,
            rewards: position.market.state.rewards.map((reward) => ({
              rewardToken: reward.asset.address,
              rewardSymbol: reward.asset.symbol,
              apy: Number(reward.borrowApr) * 100,
            })),
          },
        ],
      };
    });

    return { positions: { pools } };
  }

  async getMarketInfo(query: MarketSearchQueryDto): Promise<ProtocolPoolsDto> {
    const chainsToSearch = query.chain ? [query.chain] : SUPPORTED_CHAINS;
    const allPools: MarketPoolDto[] = [];

    for (const chain of chainsToSearch) {
      try {
        const chainId = getChainId(chain);
        const data = await this.graphqlService.getMarkets(chainId);

        // Filter markets based on query parameters
        const filteredMarkets = data.markets.items.filter((market) => {
          if (query.poolId && market.uniqueKey !== query.poolId) {
            return false;
          }
          if (
            query.collateralTokenSymbol &&
            market.collateralAsset.symbol.toLowerCase() !==
              query.collateralTokenSymbol.toLowerCase()
          ) {
            return false;
          }
          if (
            query.borrowTokenSymbol &&
            market.loanAsset.symbol.toLowerCase() !==
              query.borrowTokenSymbol.toLowerCase()
          ) {
            return false;
          }
          return true;
        });

        // Map the filtered markets to pools
        const pools = filteredMarkets.map((market) => ({
          name: `${market.collateralAsset.symbol} / ${market.loanAsset.symbol}`,
          poolId: market.uniqueKey,
          totalValueUsd: Number(market.state.collateralAssetsUsd),
          assets: [
            // Collateral asset
            {
              underlyingSymbol: market.collateralAsset.symbol,
              underlyingDecimals: market.collateralAsset.decimals,
              totalSupply: market.state.collateralAssets,
              totalSupplyUsd: market.state.collateralAssetsUsd,
              totalBorrow: '0', // Collateral can't be borrowed
              totalBorrowUsd: '0',
              liquidity: market.state.liquidityAssets,
              liquidityUsd: market.state.liquidityAssetsUsd,
              supplyApy: market.state.supplyApy,
              borrowApy: '0',
              isCollateral: true,
              rewards: market.state.rewards.map((reward) => ({
                rewardToken: reward.asset.address,
                rewardSymbol: reward.asset.symbol,
                supplyApr: reward.supplyApr,
                borrowApr: '0',
              })),
              ltv: formatEther(BigInt(market.lltv)),
            },
            // Borrow asset
            {
              underlyingSymbol: market.loanAsset.symbol,
              underlyingDecimals: market.loanAsset.decimals,
              totalSupply: market.state.supplyAssets,
              totalSupplyUsd: market.state.supplyAssetsUsd,
              totalBorrow: market.state.borrowAssets,
              totalBorrowUsd: market.state.borrowAssetsUsd,
              liquidity: market.state.liquidityAssets,
              liquidityUsd: market.state.liquidityAssetsUsd,
              supplyApy: '0', // Can't supply borrow asset
              borrowApy: market.state.borrowApy,
              isCollateral: false,
              rewards: market.state.rewards.map((reward) => ({
                rewardToken: reward.asset.address,
                rewardSymbol: reward.asset.symbol,
                supplyApr: '0',
                borrowApr: reward.borrowApr,
              })),
              ltv: '0',
            },
          ],
        }));

        allPools.push(...pools);
      } catch (error) {
        this.logger.error(
          `Failed to fetch market info for chain ${chain}:`,
          error,
        );
        // Continue with other chains even if one fails
      }
    }

    return {
      protocol: 'morpho',
      pools: allPools,
    };
  }
}
