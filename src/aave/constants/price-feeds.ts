export const PRICE_FEED_DECIMALS = {
  base: {
    WETH: 8,
    cbETH: 8,
    USDbC: 8,
    wstETH: 18,
    USDC: 8,
    weETH: 8,
    cbBTC: 8,
    GHO: 8,
    ezETH: 8
  }
} as const;

// Add DEXScreener pair addresses
export const DEXSCREENER_PAIRS = {
  base: {
    WETH: '0x4200000000000000000000000000000000000006',
    cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    wstETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    weETH: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
    cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    GHO: '0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee',
    ezETH: '0x2416092f143378750bb29b79eD961ab195CcEea5'
  }
} as const; 