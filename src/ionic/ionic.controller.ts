// External dependencies
import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Services
import { IonicService } from './ionic.service';

// DTOs and types
import {
  PoolOperationRequestDto,
  PoolOperationResponseDto,
} from './dto/pool-operations.dto';
import { SupportedChain } from '../common/types/chain.type';

// Pipes
import { ChainValidationPipe } from '../common/pipes/chain-validation.pipe';

@ApiTags('ionic')
@Controller('beta/v0/ionic')
export class IonicController {
  constructor(private readonly ionicService: IonicService) {}

  @Post('supply/:chain')
  @ApiOperation({ summary: 'Supply to Ionic pool' })
  @ApiResponse({
    status: 201,
    description: 'Returns the supply operation result',
    type: PoolOperationResponseDto,
  })
  async supply(
    @Param('chain', ChainValidationPipe) chain: SupportedChain,
    @Body() request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    return this.ionicService.supply(chain, request);
  }

  @Post('withdraw/:chain')
  @ApiOperation({ summary: 'Withdraw from Ionic pool' })
  @ApiResponse({
    status: 201,
    description: 'Returns the withdraw operation result',
    type: PoolOperationResponseDto,
  })
  async withdraw(
    @Param('chain', ChainValidationPipe) chain: SupportedChain,
    @Body() request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    return this.ionicService.withdraw(chain, request);
  }

  @Post('borrow/:chain')
  @ApiOperation({ summary: 'Borrow from Ionic pool' })
  @ApiResponse({
    status: 201,
    description: 'Returns the borrow operation result',
    type: PoolOperationResponseDto,
  })
  async borrow(
    @Param('chain', ChainValidationPipe) chain: SupportedChain,
    @Body() request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    return this.ionicService.borrow(chain, request);
  }

  @Post('repay/:chain')
  @ApiOperation({ summary: 'Repay to Ionic pool' })
  @ApiResponse({
    status: 201,
    description: 'Returns the repay operation result',
    type: PoolOperationResponseDto,
  })
  async repay(
    @Param('chain', ChainValidationPipe) chain: SupportedChain,
    @Body() request: PoolOperationRequestDto,
  ): Promise<PoolOperationResponseDto> {
    return this.ionicService.repay(chain, request);
  }
}
