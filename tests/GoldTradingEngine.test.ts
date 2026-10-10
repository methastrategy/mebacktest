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

  it('moves stop loss to break-even (entry price)', () => {
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
      stopLoss: 2390.0,
    });

    expect(pos.stopLoss).toBe(2390.0);

    const updated = engine.moveToBreakEven(pos.id);
    expect(updated).not.toBeNull();
    expect(updated?.stopLoss).toBe(2400.0);
    expect(engine.getState().openPositions[0].stopLoss).toBe(2400.0);

    // Non-existent id returns null
    expect(engine.moveToBreakEven('invalid_id')).toBeNull();
  });

  it('partially closes 50% of position and leaves remainder open', () => {
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
    });

    // Close 50% at 2410.0 (+10.0 move on 0.5 lot = $500 realized profit)
    const result = engine.partialClosePosition(pos.id, 0.5, 2410.0, 1700000060);
    expect(result).not.toBeNull();
    expect(result?.closedPosition.volume).toBe(0.5);
    expect(result?.closedPosition.realizedPnL).toBeCloseTo(500.0, 2);
    expect(result?.closedPosition.status).toBe('CLOSED_MANUAL');

    // Balance updated with closed portion
    let state = engine.getState();
    expect(state.balance).toBeCloseTo(10500.0, 2);

    // Remaining position has 0.5 lot open
    expect(result?.remainingPosition?.volume).toBe(0.5);
    expect(state.openPositions.length).toBe(1);
    expect(state.openPositions[0].volume).toBe(0.5);
    expect(state.closedPositions.length).toBe(1);

    // Close 100% of remaining position at 2420.0 (+20 move on 0.5 lot = $1000 profit)
    const fullResult = engine.partialClosePosition(pos.id, 1.0, 2420.0, 1700000120);
    expect(fullResult?.remainingPosition).toBeNull();
    expect(fullResult?.closedPosition.volume).toBe(0.5);
    expect(fullResult?.closedPosition.realizedPnL).toBeCloseTo(1000.0, 2);

    state = engine.getState();
    expect(state.balance).toBeCloseTo(11500.0, 2);
    expect(state.openPositions.length).toBe(0);
    expect(state.closedPositions.length).toBe(2);
  });

  it('accurately simulates spread for BUY and SELL orders', () => {
    // Engine with 25 pips spread ($0.25)
    const spreadEngine = new GoldTradingEngine(10000, 25);
    expect(spreadEngine.getSpread()).toBe(25);

    // BUY order at price 2400.00 -> enters at Ask = 2400.25
    const buyPos = spreadEngine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
    });
    expect(buyPos.entryPrice).toBe(2400.25);

    // At current market price 2400.00 (Bid), unrealized PnL is -$25 (spread cost)
    spreadEngine.updateMarketPrice(2400.0);
    expect(spreadEngine.getState().openPositions[0].unrealizedPnL).toBeCloseTo(-25.0, 2);

    // SELL order at price 2400.00 -> enters at Bid = 2400.00
    const sellPos = spreadEngine.openMarketOrder({
      type: 'SELL',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
      stopLoss: 2405.0,
    });
    expect(sellPos.entryPrice).toBe(2400.0);

    // At market price 2400.00, SELL current Ask is 2400.25, unrealized PnL is -$25
    spreadEngine.updateMarketPrice(2400.0);
    const sellInState = spreadEngine.getState().openPositions.find((p) => p.id === sellPos.id);
    expect(sellInState?.unrealizedPnL).toBeCloseTo(-25.0, 2);

    // SELL SL hit when bar Ask High (Bid High + 0.25) reaches SL 2405.00
    // If Bid high is 2404.80, Ask high is 2405.05 >= 2405.00 -> SL triggers!
    const bar: CandleBar = {
      time: 1700000060 as UTCTimestamp,
      open: 2401.0,
      high: 2404.8, // Bid high 2404.80 + 0.25 spread = 2405.05 Ask high -> hits 2405 SL
      low: 2400.5,
      close: 2403.0,
    };
    const triggers = spreadEngine.processBarTriggers(bar);
    expect(triggers.some((t) => t.id === sellPos.id && t.status === 'CLOSED_SL')).toBe(true);
  });

  it('rejects moving to break-even when trade is currently in a loss', () => {
    // BUY position entered at 2400.00
    const buyPos = engine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
      stopLoss: 2390.0,
    });

    // Market drops to 2380.00 (in loss)
    engine.updateMarketPrice(2380.0);
    const buyResult = engine.moveToBreakEven(buyPos.id);
    expect(buyResult).toBeNull();
    expect(engine.getState().openPositions[0].stopLoss).toBe(2390.0); // SL unchanged

    // SELL position entered at 2400.00
    const sellPos = engine.openMarketOrder({
      type: 'SELL',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
      stopLoss: 2410.0,
    });

    // Market rises to 2420.00 (in loss for SELL)
    engine.updateMarketPrice(2420.0);
    const sellResult = engine.moveToBreakEven(sellPos.id);
    expect(sellResult).toBeNull();
  });

  it('allows moving to break-even for SELL when in profit, and verifies SL fill', () => {
    // SELL 1.0 lot at 2400.00 with 25 pips spread
    const spreadEngine = new GoldTradingEngine(10000, 25);
    const sellPos = spreadEngine.openMarketOrder({
      type: 'SELL',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
    });

    // Market drops to 2390.00 (in profit, Ask is 2390.25 <= 2400.00)
    spreadEngine.updateMarketPrice(2390.0);
    const updated = spreadEngine.moveToBreakEven(sellPos.id);
    expect(updated).not.toBeNull();
    expect(updated?.stopLoss).toBe(2400.0);

    // Later bar Ask High reaches 2400.00 (Bid high is 2399.75 + 0.25 spread = 2400.00)
    const bar: CandleBar = {
      time: 1700000120 as UTCTimestamp,
      open: 2392.0,
      high: 2399.8, // Ask high 2400.05 >= 2400.00 SL
      low: 2391.0,
      close: 2398.0,
    };

    const triggers = spreadEngine.processBarTriggers(bar);
    expect(triggers.length).toBe(1);
    expect(triggers[0].status).toBe('CLOSED_SL');
    expect(triggers[0].realizedPnL).toBeCloseTo(0.0, 2); // Exactly break-even $0 PnL
    expect(spreadEngine.getState().balance).toBeCloseTo(10000.0, 2);
  });

  it('rejects partial close on 0.01 lot positions and invalid ratios', () => {
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 0.01,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
    });

    // Partial close on 0.01 lot should be rejected
    expect(engine.partialClosePosition(pos.id, 0.5, 2410.0, 1700000060)).toBeNull();
    // Invalid ratio should be rejected
    expect(engine.partialClosePosition(pos.id, 0, 2410.0, 1700000060)).toBeNull();
    expect(engine.partialClosePosition(pos.id, -0.5, 2410.0, 1700000060)).toBeNull();
    // Non-existent ID should return null
    expect(engine.partialClosePosition('missing', 0.5, 2410.0, 1700000060)).toBeNull();

    // But full close (ratio = 1.0) on 0.01 lot should succeed
    const fullClose = engine.partialClosePosition(pos.id, 1.0, 2410.0, 1700000060);
    expect(fullClose).not.toBeNull();
    expect(fullClose?.closedPosition.volume).toBe(0.01);
    expect(engine.getState().openPositions.length).toBe(0);
  });

  it('handles partial close for SELL position with spread accurately', () => {
    // 25 pips spread ($0.25). SELL enters at Bid = 2400.00
    const spreadEngine = new GoldTradingEngine(10000, 25);
    const sellPos = spreadEngine.openMarketOrder({
      type: 'SELL',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
    });

    // Partially close 50% when Bid price is 2390.00
    // BUY to close covers at Ask = 2390.00 + 0.25 = 2390.25
    // PnL on 0.5 lot = (2400.00 - 2390.25) * 0.5 * 100 = 9.75 * 50 = $487.50
    const result = spreadEngine.partialClosePosition(sellPos.id, 0.5, 2390.0, 1700000060);
    expect(result).not.toBeNull();
    expect(result?.closedPosition.volume).toBe(0.5);
    expect(result?.closedPosition.exitPrice).toBe(2390.25);
    expect(result?.closedPosition.realizedPnL).toBeCloseTo(487.5, 2);
    expect(result?.remainingPosition?.volume).toBe(0.5);
    expect(spreadEngine.getState().balance).toBeCloseTo(10487.5, 2);
  });

  it('supports successive partial closes', () => {
    const pos = engine.openMarketOrder({
      type: 'BUY',
      volume: 1.0,
      price: 2400.0,
      time: 1700000000,
      barIndex: 1,
    });

    // Step 1: 50% of 1.0 = 0.5 lot closed at 2410 (+10 move * 0.5 * 100 = $500)
    const step1 = engine.partialClosePosition(pos.id, 0.5, 2410.0, 1700000060);
    expect(step1?.closedPosition.volume).toBe(0.5);
    expect(step1?.remainingPosition?.volume).toBe(0.5);
    expect(engine.getState().balance).toBeCloseTo(10500.0, 2);

    // Step 2: 50% of 0.5 = 0.25 lot closed at 2420 (+20 move * 0.25 * 100 = $500)
    const step2 = engine.partialClosePosition(pos.id, 0.5, 2420.0, 1700000120);
    expect(step2?.closedPosition.volume).toBe(0.25);
    expect(step2?.remainingPosition?.volume).toBe(0.25);
    expect(engine.getState().balance).toBeCloseTo(11000.0, 2);

    // Step 3: Remaining 0.25 closed at 2430 (+30 move * 0.25 * 100 = $750)
    const step3 = engine.partialClosePosition(pos.id, 1.0, 2430.0, 1700000180);
    expect(step3?.closedPosition.volume).toBe(0.25);
    expect(step3?.remainingPosition).toBeNull();
    expect(engine.getState().balance).toBeCloseTo(11750.0, 2);
    expect(engine.getState().openPositions.length).toBe(0);
  });
});
