import { describe, it, expect, beforeEach } from 'vitest';
import { PropFirmEngine } from '../src/core/PropFirmEngine';

describe('PropFirmEngine', () => {
  let engine: PropFirmEngine;

  beforeEach(() => {
    // $100,000 Prop Challenge (Daily limit 5% = $5,000, Total limit 10% = $10,000, Target 8% = $8,000)
    engine = new PropFirmEngine({
      initialBalance: 100000,
      maxDailyLossPercent: 5.0,
      maxTotalLossPercent: 10.0,
      targetProfitPercent: 8.0,
    });
  });

  it('initializes with active status and zero drawdowns', () => {
    const status = engine.getStatus();
    expect(status.status).toBe('ACTIVE');
    expect(status.dailyLossPercent).toBe(0);
    expect(status.totalLossPercent).toBe(0);
    expect(status.currentEquity).toBe(100000);
  });

  it('tracks profit towards target and detects PASSED state', () => {
    // Equity grows to 108,500 (+8.5%)
    engine.updateEquity(108500, 100000, 1700000000);
    const status = engine.getStatus();
    expect(status.status).toBe('PASSED');
    expect(status.profitPercent).toBeCloseTo(8.5, 1);
  });

  it('detects Daily Loss breach when intraday floating equity drops more than 5%', () => {
    // Day starts at 100,000. Price drops to 94,500 (Loss $5,500 = 5.5%)
    engine.updateEquity(94500, 100000, 1700000000);
    const status = engine.getStatus();
    expect(status.status).toBe('BREACHED_DAILY');
    expect(status.breachReason).toContain('Daily Loss Limit Exceeded');
  });

  it('resets day baseline on new trading day', () => {
    // Day 1: profit +$2,000, balance becomes 102,000
    engine.updateEquity(102000, 102000, 1700000000); // Day 1
    // Day 2 timestamp (e.g. +86400 seconds)
    engine.updateEquity(102000, 102000, 1700086400); // Day 2
    
    // Day 2 daily loss limit is 5% of initial $100,000 = $5,000 from day start balance (102,000)
    // Equity drops to 98,000 (Drop $4,000 < $5,000 -> Still active)
    engine.updateEquity(98000, 102000, 1700086400 + 3600);
    expect(engine.getStatus().status).toBe('ACTIVE');

    // Equity drops to 96,500 (Drop $5,500 > $5,000 -> Breached Daily)
    engine.updateEquity(96500, 102000, 1700086400 + 7200);
    expect(engine.getStatus().status).toBe('BREACHED_DAILY');
  });

  it('detects Max Total Loss breach regardless of days', () => {
    // Equity drops below $90,000 (Total Loss > $10,000)
    engine.updateEquity(89000, 92000, 1700000000);
    const status = engine.getStatus();
    expect(status.status).toBe('BREACHED_TOTAL');
  });
});
