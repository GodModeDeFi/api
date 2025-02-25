import { Test, TestingModule } from '@nestjs/testing';
import { IonicService } from '../ionic/ionic.service';
import { MorphoService } from '../morpho/morpho.service';
import { MarketsService } from './markets.service';
import { MarketSearchQueryDto } from '../common/dto/market-search.dto';
import { MarketsResponseDto } from '../common/dto/market.dto';
import { AaveService } from 'src/aave/aave.service';
describe('MarketsService', () => {
  let service: MarketsService;
  let ionicService: IonicService;
  let morphoService: MorphoService;
  let aaveService: AaveService;

  const mockMarket = {
    id: 'WETH',
    totalValueUsd: 1000000,
    supplyApy: 3.5,
    borrowApy: 4.2,
  };

  const mockIonicMarkets: MarketsResponseDto = {
    totalValueUsd: 750000,
    markets: [mockMarket],
  };

  const mockMorphoMarkets: MarketsResponseDto = {
    totalValueUsd: 500000,
    markets: [mockMarket],
  };

  const mockAaveMarkets: MarketsResponseDto = {
    totalValueUsd: 250000,
    markets: [mockMarket],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketsService,
        {
          provide: IonicService,
          useValue: {
            getMarketInfo: jest.fn().mockResolvedValue(mockIonicMarkets),
          },
        },
        {
          provide: MorphoService,
          useValue: {
            getMarketInfo: jest.fn().mockResolvedValue(mockMorphoMarkets),
          },
        },
        {
          provide: AaveService,
          useValue: {
            getMarketInfo: jest.fn().mockResolvedValue(mockAaveMarkets),
          },
        },
      ],
    }).compile();

    service = module.get<MarketsService>(MarketsService);
    ionicService = module.get<IonicService>(IonicService);
    morphoService = module.get<MorphoService>(MorphoService);
    aaveService = module.get<AaveService>(AaveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProtocolMarkets', () => {
    it('should return ionic markets when protocol is ionic', async () => {
      const query: MarketSearchQueryDto = { chain: 'base', asset: 'ETH' };
      const result = await service.getProtocolMarkets(
        'ionic',
        query.chain,
        query.asset,
      );

      expect(result).toEqual({
        protocol: 'ionic',
        totalValueUsd: mockIonicMarkets.totalValueUsd,
        markets: mockIonicMarkets.markets,
      });
      expect(ionicService.getMarketInfo).toHaveBeenCalledWith(query);
    });

    it('should return morpho markets when protocol is morpho and chain is provided', async () => {
      const query: MarketSearchQueryDto = { chain: 'base', asset: 'ETH' };
      const result = await service.getProtocolMarkets(
        'morpho',
        query.chain,
        query.asset,
      );

      expect(result).toEqual({
        protocol: 'morpho',
        totalValueUsd: mockMorphoMarkets.totalValueUsd,
        markets: mockMorphoMarkets.markets,
      });
      expect(morphoService.getMarketInfo).toHaveBeenCalledWith({
        chain: query.chain,
        collateralTokenSymbol: query.asset,
        borrowTokenSymbol: query.asset,
      });
    });

    it('should return empty morpho markets when chain is not provided', async () => {
      const result = await service.getProtocolMarkets(
        'morpho',
        undefined,
        'ETH',
      );

      expect(result).toEqual({
        protocol: 'morpho',
        totalValueUsd: 0,
        markets: [],
      });
      expect(morphoService.getMarketInfo).not.toHaveBeenCalled();
    });

    it('should return aave markets when protocol is aave', async () => {
      const query: MarketSearchQueryDto = { chain: 'base', asset: 'ETH' };
      const result = await service.getProtocolMarkets(
        'aave',
        query.chain,
        query.asset,
      );

      expect(result).toEqual({
        protocol: 'aave',
        totalValueUsd: mockAaveMarkets.totalValueUsd,
        markets: mockAaveMarkets.markets,
      });
      expect(aaveService.getMarketInfo).toHaveBeenCalledWith(query);
    });
  });

  describe('getAllMarkets', () => {
    it('should aggregate markets from all protocols', async () => {
      const query: MarketSearchQueryDto = { chain: 'base', asset: 'ETH' };
      const result = await service.getAllMarkets(query.chain, query.asset);

      expect(result).toEqual({
        totalValueUsd:
          mockIonicMarkets.totalValueUsd + 
          mockMorphoMarkets.totalValueUsd + 
          mockAaveMarkets.totalValueUsd,
        protocols: [
          {
            protocol: 'ionic',
            totalValueUsd: mockIonicMarkets.totalValueUsd,
            markets: mockIonicMarkets.markets,
          },
          {
            protocol: 'morpho',
            totalValueUsd: mockMorphoMarkets.totalValueUsd,
            markets: mockMorphoMarkets.markets,
          },
          {
            protocol: 'aave',
            totalValueUsd: mockAaveMarkets.totalValueUsd,
            markets: mockAaveMarkets.markets,
          },
        ],
      });
    });

    it('should filter out protocols with no markets', async () => {
      const emptyMarkets: MarketsResponseDto = {
        totalValueUsd: 0,
        markets: [],
      };
      jest
        .spyOn(ionicService, 'getMarketInfo')
        .mockResolvedValueOnce(emptyMarkets);
      jest
        .spyOn(aaveService, 'getMarketInfo')
        .mockResolvedValueOnce(emptyMarkets);

      const result = await service.getAllMarkets('base', 'ETH');

      expect(result.protocols).toHaveLength(1);
      expect(result.protocols[0].protocol).toBe('morpho');
    });

    it('should handle no chain parameter', async () => {
      const result = await service.getAllMarkets(undefined, 'ETH');

      expect(result.protocols).toHaveLength(2);
      expect(result.protocols[0].protocol).toBe('ionic');
      expect(result.protocols[1].protocol).toBe('aave');
      expect(morphoService.getMarketInfo).not.toHaveBeenCalled();
    });
  });
});
