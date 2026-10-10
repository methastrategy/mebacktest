import { describe, it, expect } from 'vitest';
import { ASSET_SPECS, getAssetSpec } from '../src/core/AssetSpecs';
import { GoldTradingEngine } from '../src/core/GoldTradingEngine';

describe('AssetSpecs and Multi-Asset Engine', () => {
  it('correctly provides specifications for all 8 supported assets', () => {
    const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'US100', 'US30'];
    for (const sym of symbols) {
      const spec = getAssetSpec(sym);
      expect(spec.symbol).toBe(sym);
      expect(spec.multiplier).toBeGreaterThan(0);
      expect(spec.pipScale).toBeGreaterThan(0);
      expect(spec.digits).toBeGreaterThanOrEqual(1);
    }
  });

  it('calculates Forex EURUSD PnL and pips correctly (1 lot = 100,000 units)', () => {
    const engine = new GoldTradingEngine(10000, 1.0, 'EURUSD');
    expect(engine.getAssetSymbol()).toBe('EURUSD');

    // Open Buy 1.00 Lot at 1.08000
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 1.08000,
      time: 1700000000,
      barIndex: 1,
      spread: 0,
    });

    expect(pos.entryPrice).toBe(1.08000);

    // Price moves to 1.08100 (+10 pips / +0.00100)
    engine.updateMarketPrice(1.08100);
    const state = engine.getState();
    // 0.00100 * 1.0 * 100,000 = $100.00
    expect(state.openPositions[0].unrealizedPnL).toBeCloseTo(100.0, 2);
    expect(state.openPositions[0].pips).toBeCloseTo(10.0, 1);
  });

  it('calculates Crypto BTCUSD PnL and pips correctly (1 lot = 1 BTC)', () => {
    const engine = new GoldTradingEngine(50000, 10.0, 'BTCUSD');
    expect(engine.getAssetSymbol()).toBe('BTCUSD');

    // Open Buy 0.50 Lot at 60,000
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 0.5,
      price: 60000.0,
      time: 1700000000,
      barIndex: 1,
      spread: 0,
    });

    // Price moves to 62,000 (+$2,000 move)
    engine.updateMarketPrice(62000.0);
    const state = engine.getState();
    // 2000 * 0.5 * 1 = $1000.00
    expect(state.openPositions[0].unrealizedPnL).toBeCloseTo(1000.0, 2);
    expect(state.openPositions[0].pips).toBeCloseTo(2000.0, 1);
  });
});
