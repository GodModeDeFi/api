import { Module } from '@nestjs/common';
import { IonicModule } from '../ionic/ionic.module';
import { MorphoModule } from '../morpho/morpho.module';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { AaveModule } from 'src/aave/aave.module';

@Module({
  imports: [IonicModule, MorphoModule, AaveModule],
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
