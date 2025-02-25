export const POOL_ABI = [
  // Pool ABI from Aave docs
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { name: 'configuration', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint128' },
      { name: 'currentLiquidityRate', type: 'uint128' },
      { name: 'variableBorrowIndex', type: 'uint128' },
      { name: 'currentVariableBorrowRate', type: 'uint128' },
      { name: 'currentStableBorrowRate', type: 'uint128' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
      { name: 'id', type: 'uint16' },
      { name: 'aTokenAddress', type: 'address' },
      { name: 'stableDebtTokenAddress', type: 'address' },
      { name: 'variableDebtTokenAddress', type: 'address' },
      { name: 'interestRateStrategyAddress', type: 'address' },
      { name: 'accruedToTreasury', type: 'uint128' },
      { name: 'unbacked', type: 'uint128' },
      { name: 'isolationModeTotalDebt', type: 'uint128' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveNormalizedIncome',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Add other needed functions
];

export const POOL_DATA_PROVIDER_ABI = [
  {
    inputs: [],
    name: 'getAllReservesTokens',
    outputs: [
      {
        components: [
          { name: 'symbol', type: 'string' },
          { name: 'tokenAddress', type: 'address' }
        ],
        internalType: 'struct AaveProtocolDataProvider.TokenData[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveConfigurationData',
    outputs: [
      { name: 'decimals', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'liquidationThreshold', type: 'uint256' },
      { name: 'liquidationBonus', type: 'uint256' },
      { name: 'reserveFactor', type: 'uint256' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
      { name: 'borrowingEnabled', type: 'bool' },
      { name: 'stableBorrowRateEnabled', type: 'bool' },
      { name: 'isActive', type: 'bool' },
      { name: 'isFrozen', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { name: 'totalSupply', type: 'uint256' },
      { name: 'totalBorrow', type: 'uint256' },
      { name: 'supplyRate', type: 'uint256' },
      { name: 'borrowRate', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReservePrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const; 
export const ATOKEN_ABI = [
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }
  ] as const;
  
  export const DEBT_TOKEN_ABI = [
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }
  ] as const; 
  export const ERC20_ABI = [ 
      {
        inputs: [],
        name: 'decimals',
        outputs: [{ type: 'uint8' }],
        stateMutability: 'view',
        type: 'function'
      }
    ] as const;
    
    // Add ERC20 approve ABI
    export const ERC20_APPROVE_ABI = [{
      name: 'approve',
      type: 'function',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ type: 'bool' }],
      stateMutability: 'nonpayable'
    }] as const;