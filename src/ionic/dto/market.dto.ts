import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SupportedChain } from '../../common/types/chain.type';

export class GetMarketAddressParamsDto {
  @ApiProperty({
    description: 'The blockchain network',
    enum: ['base', 'mode', 'mainnet'],
    example: 'base',
  })
  chain: SupportedChain;

  @ApiProperty({
    description: 'The asset symbol',
    example: 'WETH',
  })
  @IsString()
  asset: string;
}

export class MarketInfoDto {
  @ApiProperty({
    description: 'The market (cToken) address',
    example: '0x1234567890123456789012345678901234567890',
  })
  address: string;

  @ApiProperty({
    description: 'The pool address',
    example: '0x1234567890123456789012345678901234567890',
  })
  pool_address: string;

  @ApiProperty({
    description: 'The underlying token address',
    example: '0x1234567890123456789012345678901234567890',
  })
  underlying_address: string;

  @ApiProperty({
    description: 'The underlying token name',
    example: 'Wrapped Ether',
  })
  underlying_name: string;

  @ApiProperty({
    description: 'The underlying token symbol',
    example: 'WETH',
  })
  underlying_symbol: string;

  @ApiProperty({
    description: 'The token decimals',
    example: 18,
  })
  decimals: number;

  @ApiProperty({
    description: 'The underlying token price',
    example: 0.00030477,
  })
  underlying_price: number;

  @ApiProperty({
    description: 'The USD price',
    example: 1.00278792,
  })
  usd_price: number;

  @ApiProperty({
    description: 'The exchange rate',
    example: 0.20059557,
  })
  exchange_rate: number;

  @ApiProperty({
    description: 'The total supply in underlying token units',
    example: '58427144719',
  })
  total_supply: string;

  @ApiProperty({
    description: 'The total supply in USD',
    example: 58590.03516664,
  })
  total_supply_usd: number;

  @ApiProperty({
    description: 'The total borrow in underlying token units',
    example: '22313184630',
  })
  total_borrow: string;

  @ApiProperty({
    description: 'The total borrow in USD',
    example: 22375.39209624,
  })
  total_borrow_usd: number;

  @ApiProperty({
    description: 'The utilization rate',
    example: 1.90381856,
  })
  utilization_rate: number;

  @ApiProperty({
    description: 'The supply APY',
    example: 1.8545982,
  })
  supply_apy: number;

  @ApiProperty({
    description: 'The borrow APY',
    example: 7.1152413,
  })
  borrow_apy: number;

  @ApiProperty({
    description: 'Whether the market is listed',
    example: true,
  })
  is_listed: boolean;

  @ApiProperty({
    description: 'The collateral factor',
    example: 0.5,
  })
  collateral_factor: number;

  @ApiProperty({
    description: 'The reserve factor',
    example: 0.1,
  })
  reserve_factor: number;

  @ApiProperty({
    description: 'The borrow cap',
    example: '200000000000',
  })
  borrow_cap: string;

  @ApiProperty({
    description: 'The supply cap',
    example: '200000000000',
  })
  supply_cap: string;

  @ApiProperty({
    description: 'Whether borrowing is paused',
    example: false,
  })
  is_borrow_paused: boolean;

  @ApiProperty({
    description: 'Whether minting (supply) is paused',
    example: false,
  })
  is_mint_paused: boolean;

  @ApiProperty({
    description: 'The reward tokens',
    example: ['0x3f608a49a3ab475da7fbb167c1be6b7a45cd7013'],
  })
  reward_tokens: string[];

  @ApiProperty({
    description: 'The reward APY for borrowing',
    example: 0,
  })
  reward_apy_borrow: string;

  @ApiProperty({
    description: 'The reward APY for supplying',
    example: '7.4535239060153105',
  })
  reward_apy_supply: string;

  @ApiProperty({
    description: 'The total supply APY including rewards',
    example: '9.30812210881434',
  })
  total_supply_apy: number;

  @ApiProperty({
    description: 'The total borrow APY including rewards',
    example: -7.115241297998387,
  })
  total_borrow_apy: number;
}

export class MarketsResponseDto {
  @ApiProperty({
    description: 'List of markets matching the query parameters',
    type: [MarketInfoDto],
  })
  markets: MarketInfoDto[];
}
