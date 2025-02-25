import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MorphoModule } from './morpho/morpho.module';
import { IonicModule } from './ionic/ionic.module';
import { DatabaseModule } from './common/database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PositionsModule } from './positions/positions.module';
import { SharedModule } from './common/shared.module';
import { MarketsModule } from './markets/markets.module';
import { AaveModule } from './aave/aave.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    SharedModule,
    MorphoModule,
    IonicModule,
    AaveModule,
    PositionsModule,
    MarketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
