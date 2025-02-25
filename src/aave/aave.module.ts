import { Module } from '@nestjs/common';
import { AaveService } from './aave.service';
import { AaveController } from './aave.controller';
import { SharedModule } from '../common/shared.module';
import { DatabaseModule } from '../common/database/database.module';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
  ],
  controllers: [AaveController],
  providers: [
    AaveService,
    TokenService
  ],
  exports: [AaveService],
})
export class AaveModule {}