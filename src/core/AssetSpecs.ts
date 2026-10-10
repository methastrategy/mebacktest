export type AssetCategory = 'metals' | 'forex' | 'crypto' | 'indices';

export interface AssetSpec {
  symbol: string;
  name: string;
  category: AssetCategory;
  icon: string;
  multiplier: number;       // Contract size: 100 for Gold, 100,000 for Forex, 1 for Crypto
  pipScale: number;         // Pips per price unit: 100 for Gold ($0.01 = 1 pip), 10,000 for EURUSD (0.0001 = 1 pip), 100 for USDJPY (0.01 = 1 pip), 1 for BTCUSD
  defaultSpread: number;    // In pips
  digits: number;           // Decimal display precision
  description: string;
}

export const ASSET_SPECS: Record<string, AssetSpec> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    category: 'metals',
    icon: '🥇',
    multiplier: 100.0,
    pipScale: 100.0,
    defaultSpread: 25,     // 25 pips = $0.25
    digits: 2,
    description: 'Spot Gold vs US Dollar (100 oz per lot)',
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'forex',
    icon: '💶',
    multiplier: 100000.0,
    pipScale: 10000.0,
    defaultSpread: 1.2,    // 1.2 pips
    digits: 5,
    description: 'Major Forex pair (100,000 units per lot)',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound / USD',
    category: 'forex',
    icon: '💷',
    multiplier: 100000.0,
    pipScale: 10000.0,
    defaultSpread: 1.8,
    digits: 5,
    description: 'Cable (100,000 units per lot)',
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'US Dollar / Yen',
    category: 'forex',
    icon: '💴',
    multiplier: 1000.0,    // Standard approximation in USD valuation
    pipScale: 100.0,
    defaultSpread: 1.5,
    digits: 3,
    description: 'Yen currency cross (100,000 units per lot)',
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'crypto',
    icon: '₿',
    multiplier: 1.0,
    pipScale: 1.0,
    defaultSpread: 20,     // $20 spread
    digits: 2,
    description: 'Bitcoin spot perpetual (1 BTC per lot)',
  },
  ETHUSD: {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'crypto',
    icon: 'Ξ',
    multiplier: 1.0,
    pipScale: 10.0,
    defaultSpread: 5,
    digits: 2,
    description: 'Ethereum spot (1 ETH per lot)',
  },
  US100: {
    symbol: 'US100',
    name: 'Nasdaq 100 Index',
    category: 'indices',
    icon: '📈',
    multiplier: 20.0,
    pipScale: 1.0,
    defaultSpread: 2.0,
    digits: 2,
    description: 'Tech heavy equity index (Mini contract)',
  },
  US30: {
    symbol: 'US30',
    name: 'Dow Jones 30 Index',
    category: 'indices',
    icon: '🏛️',
    multiplier: 5.0,
    pipScale: 1.0,
    defaultSpread: 3.0,
    digits: 1,
    description: 'Wall Street 30 Industrial Average',
  },
};

export function getAssetSpec(symbol: string): AssetSpec {
  const upper = symbol.toUpperCase();
  return ASSET_SPECS[upper] || ASSET_SPECS.XAUUSD;
}
