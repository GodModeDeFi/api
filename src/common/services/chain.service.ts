import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getChainConfig } from '../utils/chain.utils';
import { PublicClient, createPublicClient, http } from 'viem';
import { SupportedChain } from '../types/chain.type';
@Injectable()
export class ChainService {
  private readonly clients: Map<SupportedChain, PublicClient> = new Map();

  constructor(private readonly configService: ConfigService) {}

  getPublicClient(chain: SupportedChain): PublicClient {
    let client = this.clients.get(chain);
    if (!client) {
      client = this.createPublicClient(chain);
      this.clients.set(chain, client);
    }
    return client;
  }

  getChainId(chain: SupportedChain): number {
    const chainConfig = getChainConfig(chain);
    return chainConfig.id;
  }

  private createPublicClient(chain: SupportedChain): PublicClient {
    const chainConfig = getChainConfig(chain);
    const rpcUrl = this.getRpcUrl(chain);

    return createPublicClient({
      chain: chainConfig,
      transport: http(rpcUrl),
    });
  }

  private getRpcUrl(chain: SupportedChain): string | undefined {
    const envKey = `${chain.toUpperCase()}_RPC_URL`;
    const customRpcUrl = this.configService.get<string>(envKey);
    return customRpcUrl;
  }

  getClient(chain: Chain): PublicClient {
    return this.getPublicClient(chain);
  }
}
