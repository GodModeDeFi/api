import { Module } from '@nestjs/common';
import { PriceFeedService } from './services/price-feed.service';
import { ConfigModule } from '@nestjs/config';
import { ChainService } from './services/chain.service';
import { HttpModule } from '@nestjs/axios';
import { PriceService } from './services/price.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [PriceFeedService, ChainService, PriceService],
  exports: [PriceFeedService, ChainService, PriceService],
})
export class SharedModule {}
