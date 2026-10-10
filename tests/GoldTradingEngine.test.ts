import { describe, it, expect, beforeEach } from 'vitest';
import { GoldTradingEngine } from '../src/core/GoldTradingEngine';
import { CandleBar } from '../src/types/candle';
import { UTCTimestamp } from 'lightweight-charts';

describe('GoldTradingEngine', () => {
  let engine: GoldTradingEngine;

  beforeEach(() => {
    engine = new GoldTradingEngine(10000);
  });

  it('initializes with correct starting balance and equity', () => {
    const state = engine.getState();
    expect(state.balance).toBe(10000);
    expect(state.equity).toBe(10000);
    expect(state.openPositions.length).toBe(0);
    expect(state.closedPositions.length).toBe(0);
  });

  it('calculates Buy PnL correctly according to gold contract specs (1 lot = $100 per $1 move)', () => {
    // Open Buy 1.00 Lot at 2400.00
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 10,
    });

    expect(pos.entryPrice).toBe(2400.0);
    expect(pos.volume).toBe(1.0);

    // Current price moves to 2410.00 (+$10.00 move)
    engine.updateMarketPrice(2410.0);
    let state = engine.getState();
    expect(state.openPositions[0].unrealizedPnL).toBeCloseTo(1000.0, 2);
    expect(state.equity).toBeCloseTo(11000.0, 2);

    // Close position manually
    engine.closePosition(pos.id, 2410.0, 1700000060);
    state = engine.getState();
    expect(state.balance).toBeCloseTo(11000.0, 2);
    expect(state.equity).toBeCloseTo(11000.0, 2);
    expect(state.closedPositions.length).toBe(1);
    expect(state.winRate).toBe(100);
  });

  it('calculates Sell PnL correctly for fractional lot (0.50 lot)', () => {
    // Open Sell 0.50 Lot at 2400.00 with SL 2405.00
    const pos = engine.openMarketOrder({
      type: 'SELL',
      volume: 0.5,
      price: 2400.0,
      time: 1700000000,
      barIndex: 10,
      stopLoss: 2405.0,
    });

    // Price moves to 2402.00 (-$2.00 unfavorable)
    engine.updateMarketPrice(2402.0);
    let state = engine.getState();
    expect(state.openPositions[0].unrealizedPnL).toBeCloseTo(-100.0, 2);

    // Bar hits SL at 2405.00
    const bar: CandleBar = {
      time: 1700000060 as UTCTimestamp,
      open: 2402.0,
      high: 2406.0, // Exceeds SL 2405.0
      low: 2401.5,
      close: 2404.0,
    };

    const triggers = engine.processBarTriggers(bar);
    expect(triggers.length).toBe(1);
    expect(triggers[0].status).toBe('CLOSED_SL');
    expect(triggers[0].realizedPnL).toBeCloseTo(-250.0, 2);

    state = engine.getState();
    expect(state.balance).toBeCloseTo(9750.0, 2);
    expect(state.openPositions.length).toBe(0);
    expect(state.lossCount).toBe(1);
  });

  it('triggers TP on candle high for BUY position', () => {
    // Open Buy 0.20 Lot at 2400.00 with TP 2415.00
    engine.openMarketOrder({
      type: 'BUY',
      volume: 0.2,
      price: 2400.0,
      time: 1700000000,
      barIndex: 10,
      takeProfit: 2415.0,
    });

    const bar: CandleBar = {
      time: 1700000060 as UTCTimestamp,
      open: 2405.0,
      high: 2416.0, // Reaches TP 2415.0
      low: 2404.0,
      close: 2414.0,
    };

    const triggers = engine.processBarTriggers(bar);
    expect(triggers.length).toBe(1);
    expect(triggers[0].status).toBe('CLOSED_TP');
    // Profit = (2415 - 2400) * 0.2 * 100 = 15 * 20 = $300
    expect(triggers[0].realizedPnL).toBeCloseTo(300.0, 2);

    const state = engine.getState();
    expect(state.balance).toBeCloseTo(10300.0, 2);
  });
});
