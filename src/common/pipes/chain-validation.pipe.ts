import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { SupportedChain } from '../types/chain.type';

@Injectable()
export class ChainValidationPipe
  implements PipeTransform<string, SupportedChain>
{
  private readonly validChains: SupportedChain[] = ['base', 'mode', 'mainnet'];

  transform(value: string): SupportedChain {
    const chain = value.toLowerCase() as SupportedChain;
    if (!this.validChains.includes(chain)) {
      throw new BadRequestException(`Invalid chain: ${value}`);
    }
    return chain;
  }
}
