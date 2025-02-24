// External dependencies
import { Injectable, Logger } from '@nestjs/common';
import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';

// Services
import { SupabaseService } from '../common/database/supabase.service';
import { ChainService } from '../common/services/chain.service';
import { PriceFeedService } from '../common/services/price-feed.service';

// DTOs and types
import {
  PoolOperationRequestDto,
  PoolOperationResponseDto,
} from './dto/pool-operations.dto';
import { MarketSearchQueryDto } from '../common/dto/market-search.dto';
import {
  AssetPositionDto,
  PositionsResponseDto,
} from '../common/dto/position.dto';
import { MarketPoolDto, ProtocolPoolsDto } from '../common/dto/market.dto';

// Constants and ABIs
import { ADDRESSES } from './constants/addresses';
import { IonicPoolABI } from './abi/pool';
import { poolLensAbi } from './abi/poolLens';
import { flywheelLensRouterAbi } from './abi/flywheelLensRouter';

// Utils
import { formatDecimal } from '../common/utils/number.utils';
import { SUPPORTED_CHAINS, SupportedChain } from '../common/types/chain.type';

function ratePerBlockToAPY(ratePerBlock: bigint, blocksPerMin: number): number {
  const blocksPerDay = blocksPerMin * 60 * 24;
  const rateAsNumber = Number(formatUnits(ratePerBlock, 18));
  return (Math.pow(rateAsNumber * blocksPerDay + 1, 365) - 1) * 100;
}

@Injectable()
export class IonicService {
  private readonly logger = new Logger(IonicService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly chainService: ChainService,
    private readonly priceFeedService: PriceFeedService,
  ) {}

  async getMarketInfo(query: MarketSearchQueryDto): Promise<ProtocolPoolsDto> {
    const chainsToSearch = query.chain ? [query.chain] : SUPPORTED_CHAINS;
    const allPools: MarketPoolDto[] = [];

    for (const chain of chainsToSearch) {
      try {
        const chainQuery = { ...query, chain };
        const marketData =
          await this.supabaseService.getAssetMasterData(chainQuery);

        // Group markets by pool address
        const poolsMap = new Map<string, MarketPoolDto>();

        for (const data of marketData) {
          if (!poolsMap.has(data.pool_address)) {
            poolsMap.set(data.pool_address, {
              name: data.pool_address,
              poolId: data.pool_address,
              totalValueUsd: Number(data.total_supply_usd ?? 0),
              assets: [],
            });
          }

          const pool = poolsMap.get(data.pool_address)!;
          pool.assets.push({
            underlyingSymbol: data.underlying_symbol,
            totalSupply: data.total_supply ?? '0',
            totalSupplyUsd: (data.total_supply_usd ?? 0).toString(),
            totalBorrow: data.total_borrow ?? '0',
            totalBorrowUsd: (data.total_borrow_usd ?? 0).toString(),
            liquidity: data.total_supply ?? '0',
            liquidityUsd: (data.total_supply_usd ?? 0).toString(),
            supplyApy: (data.supply_apy ?? 0).toString(),
            borrowApy: (data.borrow_apy ?? 0).toString(),
            ltv: (data.collateral_factor ?? 0).toString(),
            isCollateral: true,
            rewards: data.reward_tokens
              ? JSON.parse(data.reward_tokens).map((token: any) => ({
                  rewardToken: token.address,
                  rewardSymbol: token.symbol,
                  supplyApr: (data.reward_apy_supply ?? '0').toString(),
                  borrowApr: (data.reward_apy_borrow ?? '0').toString(),
                }))
              : [],
          });
        }

        const chainPools = Array.from(poolsMap.values());
        allPools.push(...chainPools);
      } catch (error) {
        this.logger.error(`Error fetching market data for ${chain}:`, error);
      }
    }

    return {
      protocol: 'ionic',
      pools: allPools,
    };
  }

  async getPositions(
    chain: SupportedChain,
    address: Address,
  ): Promise<PositionsResponseDto> {
    const publicClient = this.chainService.getPublicClient(chain);
    const chainId = this.chainService.getChainId(chain);
    const poolLensAddress = ADDRESSES[chainId].poolLens;
    const flywheelLensRouterAddress = ADDRESSES[chainId].flywheelLensRouter;
    if (!flywheelLensRouterAddress || !poolLensAddress) {
      throw new Error('Pool lens or flywheel lens router not found');
    }
    const result = await publicClient.simulateContract({
      address: poolLensAddress,
      abi: poolLensAbi,
      functionName: 'getPublicPoolsWithData',
    });
    if (!result.result) {
      throw new Error('Failed to get public pools');
    }
    const [, pools] = result.result;
    const positions: PositionsResponseDto = {
      positions: { pools: [] },
    };
    for (const pool of pools) {
      let healthFactor = 0n;
      try {
        healthFactor = await publicClient.readContract({
          address: poolLensAddress,
          abi: poolLensAbi,
          functionName: 'getHealthFactor',
          args: [address, pool.comptroller],
        });
      } catch (error) {
        this.logger.error('Error getting health factor:', error);
      }
      const assetsResult = await publicClient.simulateContract({
        address: poolLensAddress,
        abi: poolLensAbi,
        functionName: 'getPoolAssetsByUser',
        args: [pool.comptroller, address],
      });
      if (!assetsResult.result) {
        throw new Error('Failed to get pool assets');
      }
      let rewardsInfo: ReadonlyArray<{
        market: Address;
        rewardsInfo: ReadonlyArray<{
          rewardToken: Address;
          formattedAPR: bigint;
        }>;
      }> = [];
      try {
        const rewardsInfoResult = await publicClient.simulateContract({
          address: flywheelLensRouterAddress,
          abi: flywheelLensRouterAbi,
          functionName: 'getPoolMarketRewardsInfo',
          args: [pool.comptroller],
        });
        if (rewardsInfoResult.result) {
          rewardsInfo = rewardsInfoResult.result;
        }
      } catch (error) {
        this.logger.error('Error getting rewards info:', error);
      }
      const ethUsdPrice = await this.priceFeedService.getEthUsdPrice();
      positions.positions.pools.push({
        name: pool.name,
        poolId: pool.comptroller,
        assets: assetsResult.result.map((asset) => {
          const borrowBalanceNative =
            Number(
              formatUnits(
                asset.borrowBalance,
                Number(asset.underlyingDecimals),
              ),
            ) * Number(formatUnits(asset.underlyingPrice, 18));
          const borrowBalanceUsd = borrowBalanceNative * ethUsdPrice;

          const supplyBalanceNative =
            Number(
              formatUnits(
                asset.supplyBalance,
                Number(asset.underlyingDecimals),
              ),
            ) * Number(formatUnits(asset.underlyingPrice, 18));
          const supplyBalanceUsd = supplyBalanceNative * ethUsdPrice;

          const totalSupplyNative =
            Number(
              formatUnits(asset.totalSupply, Number(asset.underlyingDecimals)),
            ) * Number(formatUnits(asset.underlyingPrice, 18));

          const totalSupplyUsd = totalSupplyNative * ethUsdPrice;
          const totalBorrowNative =
            Number(
              formatUnits(asset.totalBorrow, Number(asset.underlyingDecimals)),
            ) * Number(formatUnits(asset.underlyingPrice, 18));
          const totalBorrowUsd = totalBorrowNative * ethUsdPrice;

          const liquidityNative =
            Number(
              formatUnits(asset.liquidity, Number(asset.underlyingDecimals)),
            ) * Number(formatUnits(asset.underlyingPrice, 18));
          const liquidityUsd = liquidityNative * ethUsdPrice;

          return {
            underlyingPriceUsd: formatUnits(asset.underlyingPrice, 18),
            underlyingSymbol: asset.underlyingSymbol,
            underlyingDecimals: asset.underlyingDecimals.toString(),
            underlyingBalance: asset.underlyingBalance.toString(),
            supplyApy: ratePerBlockToAPY(asset.supplyRatePerBlock, 30),
            borrowApy: ratePerBlockToAPY(asset.borrowRatePerBlock, 30),
            totalSupply: asset.totalSupply.toString(),
            totalBorrow: asset.totalBorrow.toString(),
            supplyBalance: asset.supplyBalance.toString(),
            borrowBalance: asset.borrowBalance.toString(),
            liquidity: asset.liquidity.toString(),
            collateralFactor: asset.collateralFactor.toString(),
            reserveFactor: asset.reserveFactor.toString(),
            adminFee: asset.adminFee.toString(),
            ionicFee: asset.ionicFee.toString(),
            borrowBalanceUsd: borrowBalanceUsd.toString(),
            supplyBalanceUsd: supplyBalanceUsd.toString(),
            totalSupplyUsd: totalSupplyUsd.toString(),
            totalBorrowUsd: totalBorrowUsd.toString(),
            liquidityUsd: liquidityUsd.toString(),
            rewards: rewardsInfo
              .find((reward) => reward.market === asset.cToken)
              ?.rewardsInfo.filter((reward) => reward.formattedAPR > 0n)
              .map((reward) => ({
                rewardToken: reward.rewardToken,
                apy: Number(formatUnits(reward.formattedAPR, 18 - 2)),
                rewardSymbol: '',
              })),
          } as AssetPositionDto;
        }),
        healthFactor: formatUnits(healthFactor, 18),
      });
    }
    return positions;
  }

  async supply(
    chain: SupportedChain,
    request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    const query: MarketSearchQueryDto = {
      collateralTokenSymbol: request.call_data.asset,
      chain,
    };
    const marketData = await this.supabaseService.getAssetMasterData(query);

    if (!marketData.length) {
      throw new Error(
        `Market not found for ${request.call_data.asset} on ${chain}`,
      );
    }

    const publicClient = this.chainService.getPublicClient(chain);
    const poolInfo = marketData[0];

    const formattedAmount = formatDecimal(request.call_data.amount);
    const amountInWei = parseUnits(formattedAmount, poolInfo.decimals);

    const data = encodeFunctionData({
      abi: IonicPoolABI,
      functionName: 'mint',
      args: [amountInWei] as const,
    });

    const nonce = await publicClient.getTransactionCount({
      address: request.sender as Address,
    });
    const feeData = await publicClient.estimateFeesPerGas();

    return {
      chainId: this.chainService.getChainId(chain),
      data,
      from: request.sender,
      to: poolInfo.pool_address,
      value: 0,
      nonce: Number(nonce),
      maxFeePerGas: Number(feeData?.maxFeePerGas || 0),
      maxPriorityFeePerGas: Number(feeData?.maxPriorityFeePerGas || 0),
    };
  }

  async withdraw(
    chain: SupportedChain,
    request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    const query: MarketSearchQueryDto = {
      collateralTokenSymbol: request.call_data.asset,
      chain,
    };
    const marketData = await this.supabaseService.getAssetMasterData(query);

    if (!marketData.length) {
      throw new Error(
        `Market not found for ${request.call_data.asset} on ${chain}`,
      );
    }

    const publicClient = this.chainService.getPublicClient(chain);
    const poolInfo = marketData[0];

    const formattedAmount = formatDecimal(request.call_data.amount);
    const amountInWei = parseUnits(formattedAmount, poolInfo.decimals);

    const data = encodeFunctionData({
      abi: IonicPoolABI,
      functionName: 'redeem',
      args: [amountInWei] as const,
    });

    const nonce = await publicClient.getTransactionCount({
      address: request.sender as Address,
    });
    const feeData = await publicClient.estimateFeesPerGas();

    return {
      chainId: this.chainService.getChainId(chain),
      data,
      from: request.sender,
      to: poolInfo.pool_address,
      value: 0,
      nonce: Number(nonce),
      maxFeePerGas: Number(feeData?.maxFeePerGas || 0),
      maxPriorityFeePerGas: Number(feeData?.maxPriorityFeePerGas || 0),
    };
  }

  async borrow(
    chain: SupportedChain,
    request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    const query: MarketSearchQueryDto = {
      collateralTokenSymbol: request.call_data.asset,
      chain,
    };
    const marketData = await this.supabaseService.getAssetMasterData(query);

    if (!marketData.length) {
      throw new Error(
        `Market not found for ${request.call_data.asset} on ${chain}`,
      );
    }

    const publicClient = this.chainService.getPublicClient(chain);
    const poolInfo = marketData[0];

    const formattedAmount = formatDecimal(request.call_data.amount);
    const amountInWei = parseUnits(formattedAmount, poolInfo.decimals);

    const data = encodeFunctionData({
      abi: IonicPoolABI,
      functionName: 'borrow',
      args: [amountInWei] as const,
    });

    const nonce = await publicClient.getTransactionCount({
      address: request.sender as Address,
    });
    const feeData = await publicClient.estimateFeesPerGas();

    return {
      chainId: this.chainService.getChainId(chain),
      data,
      from: request.sender,
      to: poolInfo.pool_address,
      value: 0,
      nonce: Number(nonce),
      maxFeePerGas: Number(feeData?.maxFeePerGas || 0),
      maxPriorityFeePerGas: Number(feeData?.maxPriorityFeePerGas || 0),
    };
  }

  async repay(
    chain: SupportedChain,
    request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    const query: MarketSearchQueryDto = {
      collateralTokenSymbol: request.call_data.asset,
      chain,
    };
    const marketData = await this.supabaseService.getAssetMasterData(query);

    if (!marketData.length) {
      throw new Error(
        `Market not found for ${request.call_data.asset} on ${chain}`,
      );
    }

    const publicClient = this.chainService.getPublicClient(chain);
    const poolInfo = marketData[0];

    const formattedAmount = formatDecimal(request.call_data.amount);
    const amountInWei = parseUnits(formattedAmount, poolInfo.decimals);

    const data = encodeFunctionData({
      abi: IonicPoolABI,
      functionName: 'repayBorrow',
      args: [amountInWei] as const,
    });

    const nonce = await publicClient.getTransactionCount({
      address: request.sender as Address,
    });
    const feeData = await publicClient.estimateFeesPerGas();

    return {
      chainId: this.chainService.getChainId(chain),
      data,
      from: request.sender,
      to: poolInfo.pool_address,
      value: 0,
      nonce: Number(nonce),
      maxFeePerGas: Number(feeData?.maxFeePerGas || 0),
      maxPriorityFeePerGas: Number(feeData?.maxPriorityFeePerGas || 0),
    };
  }
}
