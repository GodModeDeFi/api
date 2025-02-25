// External dependencies
import { Module } from '@nestjs/common';

// Modules
import { IonicModule } from '../ionic/ionic.module';
import { MorphoModule } from '../morpho/morpho.module';
import { AaveModule } from '../aave/aave.module';
// Controllers and Services
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

@Module({
  imports: [IonicModule, MorphoModule, AaveModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}
