import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Protocol, PROTOCOLS } from '../../positions/positions.controller';
import { SUPPORTED_CHAINS, SupportedChain } from '../types/chain.type';

export class MarketSearchQueryDto {
  @ApiProperty({
    description: 'Filter by chain',
    enum: SUPPORTED_CHAINS,
    required: false,
  })
  @IsEnum(SUPPORTED_CHAINS)
  @IsOptional()
  chain?: SupportedChain;

  @ApiProperty({
    description: 'Filter by protocol',
    enum: PROTOCOLS,
    required: false,
  })
  @IsEnum(PROTOCOLS)
  @IsOptional()
  protocol?: Protocol;

  @ApiProperty({
    description: 'Pool ID',
    example: '0x1234567890123456789012345678901234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  poolId?: string;

  @ApiProperty({
    description: 'Underlying token address to search for',
    example: '0x1234567890123456789012345678901234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  collateralTokenSymbol?: string;

  @ApiProperty({
    description: 'Borrow token address to search for',
    example: '0x1234567890123456789012345678901234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  borrowTokenSymbol?: string;
}
