import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { BaseRequestDto } from 'src/common/dto/base-request.dto';
import { SupportedChain } from 'src/common/types/chain.type';

export class GetPositionParamsDto extends BaseRequestDto {
  @ApiProperty({
    description: 'The blockchain network',
    enum: ['base', 'mode', 'mainnet'],
    example: 'optimism',
  })
  chain: SupportedChain;

  @ApiProperty({
    description: 'The market ID',
    example:
      '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
  })
  @IsString()
  marketId: string;
}

export class MarketParamsDto {
  @ApiProperty({
    description: 'The collateral token address',
    example: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  })
  collateralToken: string;

  @ApiProperty({
    description: 'The loan token address',
    example: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  })
  loanToken: string;

  @ApiProperty({
    description: 'The oracle address',
    example: '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2',
  })
  oracle: string;

  @ApiProperty({
    description: 'The IRM address',
    example: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
  })
  irm: string;

  @ApiProperty({
    description: 'The loan-to-value threshold',
    example: '860000000000000000',
  })
  lltv: string;

  @ApiProperty({
    description: 'The market ID',
    example:
      '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
  })
  id: string;

  @ApiProperty({
    description: 'The liquidation incentive factor',
    example: '1043841336116910229',
  })
  liquidationIncentiveFactor: string;
}

export class MarketDto {
  @ApiProperty({
    description: 'The market parameters',
    type: MarketParamsDto,
  })
  params: MarketParamsDto;

  @ApiProperty({
    description: 'Total supply assets',
    example: '59663256055970',
  })
  totalSupplyAssets: string;

  @ApiProperty({
    description: 'Total borrow assets',
    example: '53760351874199',
  })
  totalBorrowAssets: string;

  @ApiProperty({
    description: 'Total supply shares',
    example: '55605411883401215335',
  })
  totalSupplyShares: string;

  @ApiProperty({
    description: 'Total borrow shares',
    example: '49608171006303704580',
  })
  totalBorrowShares: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '1738152203',
  })
  lastUpdate: string;

  @ApiProperty({
    description: 'Market fee',
    example: '0',
  })
  fee: string;

  @ApiProperty({
    description: 'Market price',
    example: '3719483834395829825594707511',
  })
  price: string;

  @ApiProperty({
    description: 'Rate at target',
    example: '2658720059',
  })
  rateAtTarget: string;
}

export class PositionDto {
  @ApiProperty({
    description: 'The user address',
    example: '0x7f65e7326F22963e2039734dDfF61958D5d284Ca',
  })
  user: string;

  @ApiProperty({
    description: 'The market ID',
    example:
      '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
  })
  marketId: string;

  @ApiProperty({
    description: 'Supply shares',
    example: '0',
  })
  supplyShares: string;

  @ApiProperty({
    description: 'Borrow shares',
    example: '0',
  })
  borrowShares: string;

  @ApiProperty({
    description: 'Supply assets',
    example: '0',
  })
  supplyAssets: string;

  @ApiProperty({
    description: 'Borrow assets',
    example: '0',
  })
  borrowAssets: string;

  @ApiProperty({
    description: 'Collateral amount',
    example: '0',
  })
  collateral: string;

  @ApiProperty({
    description: 'Market information',
    type: MarketDto,
  })
  market: MarketDto;

  @ApiProperty({
    description: 'The health factor of the position',
    example: '1500000000000000000',
    required: false,
  })
  healthFactor?: string;

  @ApiProperty({
    description: 'Whether the position is healthy',
    example: true,
    required: false,
  })
  isHealthy?: boolean;
}

export class PositionResponseDto {
  @ApiProperty({
    description: 'The position details',
    type: PositionDto,
  })
  position: PositionDto;
}
