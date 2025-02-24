// External dependencies
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Address } from 'viem';

// Services
import { PositionsService } from './positions.service';

// DTOs and types
import { PositionsResponseDto } from '../common/dto/positions.dto';
import { SupportedChain } from 'src/common/types/chain.type';

// Protocol definitions
export const PROTOCOLS = ['ionic', 'morpho', 'aave'] as const;
export type Protocol = (typeof PROTOCOLS)[number];

@ApiTags('positions')
@Controller('beta/v0/positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get(':address')
  @ApiOperation({
    summary: 'Get user positions across all chains or for a specific chain',
    description: `
Returns user positions filtered by optional chain and protocol parameters.
- If chain is specified, returns positions for that chain only
- If protocol is specified, returns positions for that protocol only
- If neither is specified, returns all positions across all chains
- Empty positions and chains with no positions are filtered out
    `,
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum address to get positions for',
    type: 'string',
    example: '0x1155b614971f16758C92c4890eD338C9e3ede6b7',
  })
  @ApiQuery({
    name: 'protocol',
    required: false,
    description: 'Filter positions by protocol',
    enum: PROTOCOLS,
    example: 'ionic',
  })
  @ApiQuery({
    name: 'chain',
    required: false,
    description: 'Filter positions by chain',
    enum: ['base', 'mode'],
    example: 'base',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the user positions information',
    type: PositionsResponseDto,
    schema: {
      $ref: '#/components/schemas/PositionsResponseDto',
    },
  })
  async getPositions(
    @Param('address') address: Address,
    @Query('protocol') protocol?: Protocol,
    @Query('chain') chain?: SupportedChain,
  ): Promise<PositionsResponseDto> {
    return this.positionsService.getAllPositions(address, protocol, chain);
  }
}
