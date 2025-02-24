import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumber, IsString, Min } from 'class-validator';
import { BaseRequestDto } from '../../common/dto/base-request.dto';
import { SupportedChain } from '../../common/types/chain.type';

export class PoolOperationParamsDto {
  @ApiProperty({
    description: 'The blockchain network',
    enum: ['base', 'mode', 'mainnet'],
    example: 'base',
  })
  chain: SupportedChain;
}

export class PoolOperationCallDataDto {
  @ApiProperty({
    description: 'The asset symbol',
    example: 'WETH',
  })
  @IsString()
  asset: string;

  @ApiProperty({
    description: 'The amount to operate with',
    example: 1.5,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'The address on behalf of which to perform the operation',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsEthereumAddress()
  on_behalf_of: string;
}

export class PoolOperationRequestDto extends BaseRequestDto {
  @ApiProperty({
    description: 'The operation call data',
    type: PoolOperationCallDataDto,
  })
  call_data: PoolOperationCallDataDto;
}

export class PoolOperationResponseDto {
  @ApiProperty({
    description: 'The chain ID',
    example: 10,
  })
  chainId: number;

  @ApiProperty({
    description: 'The encoded transaction data',
    example: '0x1234...',
  })
  data: string;

  @ApiProperty({
    description: 'The sender address',
    example: '0x1234567890123456789012345678901234567890',
  })
  from: string;

  @ApiProperty({
    description: 'The pool contract address',
    example: '0x1234567890123456789012345678901234567890',
  })
  to: string;

  @ApiProperty({
    description: 'The transaction value in wei',
    example: 0,
  })
  value: number;

  @ApiProperty({
    description: 'The transaction nonce',
    example: 42,
  })
  nonce: number;

  @ApiProperty({
    description: 'The maximum fee per gas in wei',
    example: 100000000000,
  })
  maxFeePerGas: number;

  @ApiProperty({
    description: 'The maximum priority fee per gas in wei',
    example: 1000000000,
  })
  maxPriorityFeePerGas: number;
}
