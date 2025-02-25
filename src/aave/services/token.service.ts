import { Injectable, Logger } from '@nestjs/common';
import { PublicClient, Address } from 'viem';
import { ERC20_ABI } from '../constants/abi';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly decimalsCache: Map<string, number> = new Map();

  async getDecimals(
    client: PublicClient,
    tokenAddress: Address,
  ): Promise<number> {
    const cacheKey = `${tokenAddress}`;
    
    if (this.decimalsCache.has(cacheKey)) {
      return this.decimalsCache.get(cacheKey)!;
    }

    try {
      const decimals = await client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals'
      });

      this.decimalsCache.set(cacheKey, decimals);
      return decimals;
    } catch (error) {
      this.logger.error(`Failed to get decimals for ${tokenAddress}: ${error.message}`);
      // Default to 18 decimals as fallback
      return 18;
    }
  }
} 