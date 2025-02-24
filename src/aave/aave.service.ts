import { Injectable, Logger } from '@nestjs/common';
import { SupportedChain } from '../common/types/chain.type';
import { AaveOperationParams } from './dto/aave-operation.dto';
import { SupabaseService } from '../common/database/supabase.service';
import { ChainService } from '../common/services/chain.service';
import { POOL_DATA_PROVIDER_ABI, POOL_ABI } from './constants/abi';
import { DEXSCREENER_PAIRS } from './constants/price-feeds';
import { encodeFunctionData } from 'viem';
import axios from 'axios';
import { ATOKEN_ABI, DEBT_TOKEN_ABI, ERC20_ABI, ERC20_APPROVE_ABI } from '../aave/constants/abi';
import { TokenService } from './services/token.service';
import { PublicClient, Address } from 'viem';
import { PriceService } from '../common/services/price.service';
const AAVE_V3_ADDRESSES = {
  base: {
    POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    POOL_DATA_PROVIDER: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac',
    UI_POOL_DATA_PROVIDER: '0x174446a6741300cD2E7C1b1A636Fee99c8F83032',
    UI_INCENTIVE_DATA_PROVIDER: '0x0eB187Fe0B9Dc2F533C5786fcFE83B23fD4c692A',
    WALLET_BALANCE_PROVIDER: '0xeEDa8F7D4c14E49B1421b58c0976E9E7628DDc61'
  },
//   optimism: {
//     POOL: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
//     POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
//     UI_POOL_DATA_PROVIDER: '0x91c0eA31b49B69Ea18607702c5d9aC360bf3dE7d',
//     UI_INCENTIVE_DATA_PROVIDER: '0x8AaF462990dD5CC574c94C8266208996426A47e7',
//     WALLET_BALANCE_PROVIDER: '0xBc790382B3686aB3088D1C698a839e3777f83C63'
//   }
};

interface ReserveToken {
  symbol: string;
  tokenAddress: `0x${string}`;
}

interface ReserveConfig {
  [index: number]: bigint | boolean;
}

interface ReserveData {
  [index: number]: bigint;
}



// Add price feed decimals mapping
const PRICE_FEED_DECIMALS = {
  base: {
    WETH: 8,
    cbETH: 8,
    USDbC: 8,
    wstETH: 18,
    USDC: 8,
    weETH: 8,
    cbBTC: 8,
    GHO: 8,
    ezETH: 8
  }
} as const;

// Add valid reserve tokens for Base
const VALID_RESERVES = {
  base: [
    'WETH',
    'cbETH',
    'USDbC',
    'wstETH',
    'USDC',
    'weETH',
    'cbBTC',
    'GHO',
    'ezETH'
  ]
} as const;

// Add withdraw ABI
const POOL_WITHDRAW_ABI = [{
  name: 'withdraw',
  type: 'function',
  inputs: [
    { name: 'asset', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'to', type: 'address' }
  ],
  outputs: [{ type: 'uint256' }],
  stateMutability: 'nonpayable'
}] as const;

// Update borrow ABI
const POOL_BORROW_ABI = [{
  name: 'borrow',
  type: 'function',
  inputs: [
    { name: 'asset', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'interestRateMode', type: 'uint256' },
    { name: 'referralCode', type: 'uint16' },
    { name: 'onBehalfOf', type: 'address' }
  ],
  outputs: [],
  stateMutability: 'nonpayable'
}] as const;

// Add repay ABI
const POOL_REPAY_ABI = [{
  name: 'repay',
  type: 'function',
  inputs: [
    { name: 'asset', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'interestRateMode', type: 'uint256' },
    { name: 'onBehalfOf', type: 'address' }
  ],
  outputs: [{ type: 'uint256' }],
  stateMutability: 'nonpayable'
}] as const;

// Update interface for new DEXScreener response
interface DexScreenerTokenResponse {
  pairs: Array<{
    chainId: string;
    dexId: string;
    priceUsd: string;
    priceNative:string;
    baseToken: {
      address: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      symbol: string;
    };
    liquidity: {
      usd: number;
    };
  }>;
}

@Injectable()
export class AaveService {
  private readonly logger = new Logger(AaveService.name);
  private readonly chainService: ChainService;
  private readonly tokenService: TokenService;
  private readonly priceService: PriceService;

  // Add cache for token decimals to avoid repeated calls
  private tokenDecimalsCache: Record<string, number> = {};

  constructor(
    private readonly supabaseService: SupabaseService,
    tokenService: TokenService,
    priceService: PriceService,
    chainService: ChainService
  ) {
    this.chainService = chainService;
    this.tokenService = tokenService;
    this.priceService = priceService;
  }

  // Add retry helper at the top of the class
  private async retryWithDelay<T>(
    fn: () => Promise<T>, 
    retries = 3, 
    delay = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithDelay(fn, retries - 1, delay * 2);
    }
  }

  // Add helper function to calculate APY from rate
  private calculateApy(ratePerSecond: bigint): string {
    // Handle zero rate case
    if (ratePerSecond === 0n) {
      return '0.00';
    }

    try {
      // Convert to string first, then to number
      const rateAsNumber = Number(ratePerSecond.toString());
      const RAY = 1e27; // 10^27
      
      // Convert rate to decimal percentage
      // Formula: ((1 + rate/secondsPerYear)^secondsPerYear - 1) * 100
      const ratePerSecondDecimal = rateAsNumber / RAY;
      const secondsPerYear = 31536000;
      
      const apy = (Math.pow(1 + ratePerSecondDecimal / secondsPerYear, secondsPerYear) - 1) * 100;
      
      // Handle very small rates
      if (apy < 0.01 && apy > 0) {
        return '0.01';
      }

      return apy.toFixed(2);
    } catch (error) {
      this.logger.error(`Error calculating APY: ${error.message}`);
      return '0.00';
    }
  }

  // Update the USD calculation in getMarketInfo method:
  private calculateUsdValue(amount: bigint, price: bigint, tokenDecimals: number, priceFeedDecimals: number): string {
    try {
      const amountNum = Number(amount.toString()) / (10 ** tokenDecimals);
      const priceNum = Number(price.toString()) / (10 ** 8); // Always use 8 decimals for price
      return (amountNum * priceNum).toFixed(2);
    } catch (error) {
      this.logger.error(`Error calculating USD value: ${error.message}`);
      return '0.00';
    }
  }

  async getMarketInfo(chain: SupportedChain) {
    try {
      const addresses = AAVE_V3_ADDRESSES[chain];
      if (!addresses) {
        return {
          protocol: 'aave',
          chain,
          pools: []
        };
      }

      const client = this.chainService.getClient(chain);
      const poolDataProvider = {
        address: addresses.POOL_DATA_PROVIDER,
        abi: POOL_DATA_PROVIDER_ABI
      };

      // Get all reserves first and filter valid ones
      const reserves = (await client.readContract({
        ...poolDataProvider,
        functionName: 'getAllReservesTokens'
      }) as ReserveToken[]).filter(reserve => 
        VALID_RESERVES[chain]?.includes(reserve.symbol)
      );

      // Get data for each reserve
      const assets = await Promise.all(
        reserves.map(async (reserve) => {
          const config = await client.readContract({
            ...poolDataProvider,
            functionName: 'getReserveConfigurationData',
            args: [reserve.tokenAddress]
          }) as ReserveConfig;

          const reserveData = await client.readContract({
            address: addresses.POOL,
            abi: POOL_ABI,
            functionName: 'getReserveData',
            args: [reserve.tokenAddress]
          }) as ReserveData;

          const aTokenAddress = reserveData[8] as unknown as `0x${string}`; // Index 8 is aToken address
          const debtTokenAddress = reserveData[10] as unknown as `0x${string}`; // Index 10 is variableDebtToken address

          // Get total supply from aToken
          const totalSupply = await client.readContract({
            address: aTokenAddress,
            abi: ATOKEN_ABI,
            functionName: 'totalSupply'
          }) as bigint;

          // Get total borrow from debt token
          const totalBorrow = await client.readContract({
            address: debtTokenAddress,
            abi: DEBT_TOKEN_ABI,
            functionName: 'totalSupply'
          }) as bigint;

          const supplyApy = this.calculateApy(reserveData[2]);
          const borrowApy = this.calculateApy(reserveData[4]);

          // Replace Chainlink price fetching with DEXScreener
          const priceUsd = await this.priceService.getDexScreenerPrice(
            chain, 
            reserve.symbol,
            DEXSCREENER_PAIRS[chain]?.[reserve.symbol]
          );

          // In getMarketInfo method, update the USD calculations:
          const tokenDecimals = await this.tokenService.getDecimals(client, reserve.tokenAddress);
          const priceFeedDecimals = PRICE_FEED_DECIMALS[chain]?.[reserve.symbol] || 8;

          // Update return object to include USD values with proper scaling
          return {
            underlyingSymbol: reserve.symbol,
            totalSupply: totalSupply.toString(),
            totalSupplyUsd: this.calculateUsdValue(totalSupply, priceUsd, tokenDecimals, priceFeedDecimals),
            totalBorrow: totalBorrow.toString(),
            totalBorrowUsd: this.calculateUsdValue(totalBorrow, priceUsd, tokenDecimals, priceFeedDecimals),
            liquidity: (totalSupply - totalBorrow).toString(),
            liquidityUsd: this.calculateUsdValue(totalSupply - totalBorrow, priceUsd, tokenDecimals, priceFeedDecimals),
            supplyApy,
            borrowApy,
            isCollateral: Boolean(config[5]),
            ltv: (config[1] as bigint).toString(),
            // rewards: []
          };
        })
      );

      // In getMarketInfo method, calculate total value:
      const totalValueUsd = assets.reduce((total, asset) => {
        return total + Number(asset.totalSupplyUsd);
      }, 0).toFixed(2);

      return {
        protocol: 'aave',
        chain,
        pools: [{
          name: 'Aave V3',
          poolId: addresses.POOL,
          assets,
          totalValueUsd // Use number instead of BigInt
        }]
      };
    } catch (error) {
      this.logger.error(`Error fetching Aave market info: ${error.message}`);
      throw error;
    }
  }

  async getPositions(chain: SupportedChain, address: string) {
    try {
      const addresses = AAVE_V3_ADDRESSES[chain];
      if (!addresses) {
        return { positions: { pools: [] } };
      }

      const client = this.chainService.getClient(chain);
      const poolDataProvider = {
        address: addresses.POOL_DATA_PROVIDER,
        abi: POOL_DATA_PROVIDER_ABI
      };

      // Get all reserves first and filter valid ones
      const reserves = (await client.readContract({
        ...poolDataProvider,
        functionName: 'getAllReservesTokens'
      }) as ReserveToken[]).filter(reserve => 
        VALID_RESERVES[chain]?.includes(reserve.symbol)
      );

      // Get user account data
      const accountData = await client.readContract({
        address: addresses.POOL,
        abi: POOL_ABI,
        functionName: 'getUserAccountData',
        args: [address]
      }) as [bigint, bigint, bigint, bigint, bigint, bigint];

      const [
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactor
      ] = accountData;

      // Handle health factor - if no debt, return infinity
      const displayHealthFactor = totalDebtBase === 0n ? 
        '∞' : 
        (Number(healthFactor) / 1e18).toFixed(2);

      // Get user's assets
      const assets = await Promise.all(
        reserves.map(async (reserve) => {
          // Get reserve data for APYs and token addresses
          const reserveData = await client.readContract({
            address: addresses.POOL,
            abi: POOL_ABI,
            functionName: 'getReserveData',
            args: [reserve.tokenAddress]
          }) as ReserveData;

          const aTokenAddress = reserveData[8] as unknown as `0x${string}`;
          const debtTokenAddress = reserveData[10] as unknown as `0x${string}`;

          // Get supply and borrow balances
          const supplyBalance = await client.readContract({
            address: aTokenAddress,
            abi: ATOKEN_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`]
          }) as bigint;

          const borrowBalance = await client.readContract({
            address: debtTokenAddress,
            abi: DEBT_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`]
          }) as bigint;

          if (supplyBalance === 0n && borrowBalance === 0n) return null;

          // Get price and calculate USD values
          const priceUsd = await this.priceService.getDexScreenerPrice(
            chain, 
            reserve.symbol,
            DEXSCREENER_PAIRS[chain]?.[reserve.symbol]
          );
          const tokenDecimals = await this.tokenService.getDecimals(client, reserve.tokenAddress);

          // Calculate USD values directly using the price and balance
          const supplyUsd = (Number(supplyBalance) / 10 ** tokenDecimals) * (Number(priceUsd) / 1e8);
          const borrowUsd = (Number(borrowBalance) / 10 ** tokenDecimals) * (Number(priceUsd) / 1e8);

          // Calculate APYs
          const supplyApy = this.calculateApy(reserveData[2]); // currentLiquidityRate
          const borrowApy = this.calculateApy(reserveData[4]); // currentVariableBorrowRate

          return {
            symbol: reserve.symbol,
            tokenAddress: reserve.tokenAddress,
            supplyBalance: supplyBalance.toString(),
            supplyBalanceUsd: supplyUsd.toFixed(2),
            borrowBalance: borrowBalance.toString(),
            borrowBalanceUsd: borrowUsd.toFixed(2),
            totalSupplyApy: supplyApy,
            totalBorrowApy: borrowApy,
            isCollateral: true,
            // rewards: []
          };
        })
      );

      // Filter out null assets (zero balances)
      const userAssets = assets.filter(Boolean);

      // In getPositions method, update the USD totals calculation:
      const totalSuppliedUsd = userAssets.reduce((total, asset) => {
        return total + Number(asset?.supplyBalanceUsd || 0);
      }, 0).toFixed(2);

      const totalCollateralUsd = totalSuppliedUsd; // All supplied assets are collateral in this case

      const totalBorrowUsd = userAssets.reduce((total, asset) => {
        return total + Number(asset?.borrowBalanceUsd || 0);
      }, 0).toFixed(2);

      return {
        positions: {
          pools: [{
            name: 'Aave V3',
            poolId: addresses.POOL,
            healthFactor: displayHealthFactor,
            totalSuppliedUsd,
            totalCollateralUsd,
            totalBorrowUsd,
            assets: await Promise.all(userAssets.filter((asset): asset is NonNullable<typeof asset> => asset !== null).map(async (asset) => {
              const decimals = await this.tokenService.getDecimals(client, asset.tokenAddress);
              return {
                ...asset,
                supplyBalance: (Number(BigInt(asset.supplyBalance)) / 10 ** decimals).toFixed(6),
                borrowBalance: (Number(BigInt(asset.borrowBalance)) / 10 ** decimals).toFixed(6),
                supplyBalanceUsd: Number(asset.supplyBalanceUsd).toFixed(2),
                borrowBalanceUsd: Number(asset.borrowBalanceUsd).toFixed(2)
              };
            }))
          }]
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching Aave positions: ${error.message}`);
      throw error;
    }
  }

  async supply(chain: SupportedChain, params: AaveOperationParams) {
    try {
      const addresses = AAVE_V3_ADDRESSES[chain];
      if (!addresses) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const client = this.chainService.getClient(chain);
      const encodedData = encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [addresses.POOL, params.amount]
      });

      const chainId = chain === 'base' ? 8453 : 10; // 8453 for Base, 10 for Optimism

      const gasEstimate = await client.estimateGas({
        account: params.userAddress,
        to: params.tokenAddress,
        data: encodedData,
        value: 0n
      });

      return {
        chainId,
        from: params.userAddress,
        to: params.tokenAddress,
        data: encodedData,
        value: 0n,
        nonce: await client.getTransactionCount({ address: params.userAddress }),
        maxFeePerGas: gasEstimate,
        maxPriorityFeePerGas: (await client.estimateFeesPerGas()).maxPriorityFeePerGas
      };
    } catch (error) {
      this.logger.error(`Error preparing approval tx: ${error.message}`);
      throw error;
    }
  }

  async withdraw(chain: SupportedChain, params: AaveOperationParams) {
    try {
      const addresses = AAVE_V3_ADDRESSES[chain];
      if (!addresses) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const client = this.chainService.getClient(chain);
      const encodedData = encodeFunctionData({
        abi: POOL_WITHDRAW_ABI,
        functionName: 'withdraw',
        args: [params.tokenAddress, params.amount, params.userAddress]
      });

      const chainId = chain === 'base' ? 8453 : 10;
      const gasEstimate = await client.estimateGas({
        account: params.userAddress,
        to: addresses.POOL,
        data: encodedData,
        value: 0n
      });

      return {
        chainId,
        from: params.userAddress,
        to: addresses.POOL,
        data: encodedData,
        value: 0n,
        nonce: await client.getTransactionCount({ address: params.userAddress }),
        maxFeePerGas: gasEstimate,
        maxPriorityFeePerGas: (await client.estimateFeesPerGas()).maxPriorityFeePerGas
      };
    } catch (error) {
      this.logger.error(`Error preparing withdraw tx: ${error.message}`);
      throw error;
    }
  }

  async borrow(chain: SupportedChain, params: AaveOperationParams) {
    try {
      const addresses = AAVE_V3_ADDRESSES[chain];
      if (!addresses) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const client = this.chainService.getClient(chain);

      // Check user account data first
      const accountData = await client.readContract({
        address: addresses.POOL,
        abi: POOL_ABI,
        functionName: 'getUserAccountData',
        args: [params.userAddress]
      }) as [bigint, bigint, bigint, bigint, bigint, bigint];

      const [, , availableBorrowsBase] = accountData;

      if (availableBorrowsBase === 0n) {
        throw new Error('No collateral available for borrowing');
      }

      // Then proceed with borrow
      const encodedData = encodeFunctionData({
        abi: POOL_BORROW_ABI,
        functionName: 'borrow',
        args: [
          params.tokenAddress,
          params.amount,
          2n,
          0,
          params.userAddress
        ]
      });

      const chainId = chain === 'base' ? 8453 : 10;
      const gasEstimate = await client.estimateGas({
        account: params.userAddress,
        to: addresses.POOL,
        data: encodedData,
        value: 0n
      });

      return {
        chainId,
        from: params.userAddress,
        to: addresses.POOL,
        data: encodedData,
        value: 0n,
        nonce: await client.getTransactionCount({ address: params.userAddress }),
        maxFeePerGas: gasEstimate,
        maxPriorityFeePerGas: (await client.estimateFeesPerGas()).maxPriorityFeePerGas
      };
    } catch (error) {
      this.logger.error(`Error preparing borrow tx: ${error.message}`);
      throw error;
    }
  }

  async repay(chain: SupportedChain, params: AaveOperationParams) {
    try {
      const addresses = AAVE_V3_ADDRESSES[chain];
      if (!addresses) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const client = this.chainService.getClient(chain);

      // Get reserve data to find debt token addresses
      const debtTokenAddress = await client.readContract({
        address: addresses.POOL,
        abi: POOL_ABI,
        functionName: 'getReserveData',
        args: [params.tokenAddress]
      }) as ReserveData;

      const variableDebtToken = debtTokenAddress[10] as unknown as Address;
      const stableDebtToken = debtTokenAddress[9] as unknown as Address;

      // Check both debt balances
      const variableDebt = await client.readContract({
        address: variableDebtToken,
        abi: DEBT_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [params.userAddress]
      }) as bigint;

      const stableDebt = await client.readContract({
        address: stableDebtToken,
        abi: DEBT_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [params.userAddress]
      }) as bigint;

      // Determine interest rate mode based on which debt exists
      const interestRateMode = stableDebt > 0n ? 1n : 2n;
      if (stableDebt === 0n && variableDebt === 0n) {
        throw new Error('No debt found');
      }

      // First create approval transaction
      const approvalData = encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [addresses.POOL, params.amount]
      });

      // Return approval tx first
      return {
        chainId: chain === 'base' ? 8453 : 10,
        from: params.userAddress,
        to: params.tokenAddress,
        data: approvalData,
        value: 0n,
        nonce: await client.getTransactionCount({ address: params.userAddress }),
        maxFeePerGas: await client.estimateGas({
          account: params.userAddress,
          to: params.tokenAddress,
          data: approvalData,
          value: 0n
        }),
        maxPriorityFeePerGas: (await client.estimateFeesPerGas()).maxPriorityFeePerGas
      };

    } catch (error) {
      this.logger.error(`Error preparing repay tx: ${error.message}`);
      throw error;
    }
  }
} 