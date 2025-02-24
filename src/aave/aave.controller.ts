import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AaveService } from './aave.service';
import { TokenService } from './services/token.service';
import { ChainService } from '../common/services/chain.service';
// import { BaseRequestDto } from '../common/dto/base-request.dto';
import { PositionsResponseDto } from '../common/dto/position.dto';
import { SupportedChain } from '../common/types/chain.type';
import { AaveOperationDto } from './dto/aave-operation.dto';
import { AaveOperationParams } from './dto/aave-operation.dto';
import { TOKEN_ADDRESSES } from './constants/tokens';

@ApiTags('aave')
@Controller('beta/v0/aave')
export class AaveController {
  constructor(
    private readonly aaveService: AaveService,
    private readonly tokenService: TokenService,
    private readonly chainService: ChainService
  ) {}

  @Get('market/:chain')
  @ApiOperation({ summary: 'Get Aave market information for a specific chain' })
  @ApiParam({ name: 'chain', enum: ['optimism', 'base'] })
  @ApiResponse({
    status: 200,
    description: 'Returns market information for the specified chain',
  })
  async getMarketInfo(@Param('chain') chain: SupportedChain) {
    return this.aaveService.getMarketInfo(chain);
  }

  @Get('position/:chain/:address')
  @ApiOperation({ summary: 'Get user positions in Aave markets' })
  @ApiParam({ name: 'chain', enum: ['optimism', 'base'] })
  @ApiParam({ name: 'address', description: 'User address' })
  @ApiResponse({
    status: 200,
    description: 'Returns user positions',
    type: PositionsResponseDto
  })
  async getPositions(
    @Param('chain') chain: SupportedChain,
    @Param('address') address: string,
  ) {
    return this.aaveService.getPositions(chain, address);
  }

  @Post('supply/:chain')
  @ApiOperation({ summary: 'Supply assets to Aave pool' })
  @ApiParam({ name: 'chain', enum: ['optimism', 'base'] })
  async supply(
    @Param('chain') chain: SupportedChain,
    @Body() dto: AaveOperationDto,
  ) {
    const tokenAddress = TOKEN_ADDRESSES[chain]?.[dto.call_data.asset];
    if (!tokenAddress) {
      throw new Error(`Unsupported token ${dto.call_data.asset} on chain ${chain}`);
    }

    const client = this.chainService.getClient(chain);
    const decimals = await this.tokenService.getDecimals(client, tokenAddress);
    const amount = BigInt(Math.floor(dto.call_data.amount * (10 ** decimals)));

    const params: AaveOperationParams = {
      tokenAddress,
      amount,
      userAddress: dto.call_data.on_behalf_of as `0x${string}`
    };
    return this.aaveService.supply(chain, params);
  }

  @Post('withdraw/:chain')
  @ApiOperation({ summary: 'Withdraw assets from Aave pool' })
  @ApiParam({ name: 'chain', enum: ['optimism', 'base'] })
  async withdraw(
    @Param('chain') chain: SupportedChain,
    @Body() withdrawData: AaveOperationDto,
  ) {
    const tokenAddress = TOKEN_ADDRESSES[chain]?.[withdrawData.call_data.asset];
    if (!tokenAddress) {
      throw new Error(`Unsupported token ${withdrawData.call_data.asset} on chain ${chain}`);
    }

    const client = this.chainService.getClient(chain);
    const decimals = await this.tokenService.getDecimals(client, tokenAddress);
    const amount = BigInt(Math.floor(withdrawData.call_data.amount * (10 ** decimals)));

    const params: AaveOperationParams = {
      tokenAddress,
      amount,
      userAddress: withdrawData.call_data.on_behalf_of as `0x${string}`
    };
    return this.aaveService.withdraw(chain, params);
  }

  @Post('borrow/:chain')
  @ApiOperation({ summary: 'Borrow assets from Aave pool' })
  @ApiParam({ name: 'chain', enum: ['optimism', 'base'] })
  async borrow(
    @Param('chain') chain: SupportedChain,
    @Body() borrowData: AaveOperationDto,
  ) {
    const tokenAddress = TOKEN_ADDRESSES[chain]?.[borrowData.call_data.asset];
    if (!tokenAddress) {
      throw new Error(`Unsupported token ${borrowData.call_data.asset} on chain ${chain}`);
    }

    const client = this.chainService.getClient(chain);
    const decimals = await this.tokenService.getDecimals(client, tokenAddress);
    const amount = BigInt(Math.floor(borrowData.call_data.amount * (10 ** decimals)));

    const params: AaveOperationParams = {
      tokenAddress,
      amount,
      userAddress: borrowData.call_data.on_behalf_of as `0x${string}`
    };
    return this.aaveService.borrow(chain, params);
  }

  @Post('repay/:chain')
  @ApiOperation({ summary: 'Repay borrowed assets to Aave pool' })
  @ApiParam({ name: 'chain', enum: ['optimism', 'base'] })
  async repay(
    @Param('chain') chain: SupportedChain,
    @Body() repayData: AaveOperationDto,
  ) {
    const tokenAddress = TOKEN_ADDRESSES[chain]?.[repayData.call_data.asset];
    if (!tokenAddress) {
      throw new Error(`Unsupported token ${repayData.call_data.asset} on chain ${chain}`);
    }

    const client = this.chainService.getClient(chain);
    const decimals = await this.tokenService.getDecimals(client, tokenAddress);
    const amount = BigInt(Math.floor(repayData.call_data.amount * (10 ** decimals)));

    const params: AaveOperationParams = {
      tokenAddress,
      amount,
      userAddress: repayData.call_data.on_behalf_of as `0x${string}`    
    };
    return this.aaveService.repay(chain, params);
  }
} 