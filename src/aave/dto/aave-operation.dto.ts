import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { BaseRequestDto } from '../../common/dto/base-request.dto';

export class AaveOperationCallDataDto {
  @ApiProperty({
    description: 'Asset symbol or address',
    example: 'WETH',
  })
  @IsString()
  asset: string;

  @ApiProperty({
    description: 'Amount of asset',
    example: 1.5,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Address to perform operation on behalf of',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  on_behalf_of: string;
}

export interface AaveOperationParams {
  tokenAddress: `0x${string}`;
  amount: bigint;
  userAddress: `0x${string}`;
}

export class AaveOperationDto extends BaseRequestDto {
  @ApiProperty({
    description: 'Operation data',
    type: AaveOperationCallDataDto,
  })
  call_data: AaveOperationCallDataDto;
} 