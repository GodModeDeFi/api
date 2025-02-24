import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Chain } from '../types/chain.type';

interface DexScreenerTokenResponse {
  pairs: Array<{
    chainId: string;
    dexId: string;
    priceUsd: string;
    priceNative: string;
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
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private priceCache: Map<string, { price: bigint; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Add static prices for tokens without DEX pairs
  private readonly STATIC_PRICES: Record<string, number> = {
    'GHO': 1.00, // GHO is a stablecoin pegged to $1
    'USDbC': 1.00, // Base stablecoin
    'USDC': 1.00 // USDC stablecoin
  };

  async getDexScreenerPrice(chain: Chain, symbol: string, tokenAddress: string): Promise<bigint> {
    try {
      const cacheKey = `${chain}-${symbol}`;
      const now = Date.now();
      const cached = this.priceCache.get(cacheKey);

      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        return cached.price;
      }

      // Use static price if available
      if (this.STATIC_PRICES[symbol]) {
        const price = BigInt(Math.floor(this.STATIC_PRICES[symbol] * 1e8));
        this.priceCache.set(cacheKey, { price, timestamp: now });
        return price;
      }

      if (!tokenAddress) {
        throw new Error(`No token address for ${symbol}`);
      }

      const response = await axios.get<DexScreenerTokenResponse>(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
      );
      
      const pairs = response.data.pairs;
      if (!pairs?.length) {
        throw new Error(`No pairs found for ${symbol}`);
      }

      const price = BigInt(Math.floor(Number(pairs[0].priceUsd) * 1e8));
      this.priceCache.set(cacheKey, { price, timestamp: now });
      
      return price;
    } catch (error) {
      this.logger.error(`Error fetching price for ${symbol}: ${error.message}`);
      return 0n;
    }
  }
} 