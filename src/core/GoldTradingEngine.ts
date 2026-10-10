import { CandleBar } from '../types/candle';
import { AccountState, OrderType, Position } from '../types/trade';
import { AssetSpec, getAssetSpec } from './AssetSpecs';

export interface OpenOrderParams {
  type: OrderType;
  volume: number;
  price: number;
  time: number;
  barIndex: number;
  stopLoss?: number;
  takeProfit?: number;
  spread?: number;
  setupTag?: string;
}

export class GoldTradingEngine {
  private initialBalance: number;
  private balance: number;
  private peakEquity: number;
  private maxDrawdown: number;
  private maxDrawdownPercent: number;
  private openPositions: Position[] = [];
  private closedPositions: Position[] = [];
  private currentMarketPrice: number = 0;
  private spread: number = 0; // in pips
  private assetSymbol: string = 'XAUUSD';
  private spec: AssetSpec = getAssetSpec('XAUUSD');

  constructor(initialBalance: number = 10000, spreadPips: number = 0, symbol: string = 'XAUUSD') {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.peakEquity = initialBalance;
    this.maxDrawdown = 0;
    this.maxDrawdownPercent = 0;
    this.spread = Math.max(0, spreadPips);
    this.assetSymbol = symbol;
    this.spec = getAssetSpec(symbol);
  }

  public getAssetSymbol(): string {
    return this.assetSymbol;
  }

  public getAssetSpec(): AssetSpec {
    return this.spec;
  }

  public setAssetSymbol(symbol: string): void {
    this.assetSymbol = symbol;
    this.spec = getAssetSpec(symbol);
  }

  public getSpread(): number {
    return this.spread;
  }

  public setSpread(pips: number): void {
    this.spread = Math.max(0, pips);
  }

  public reset(balance: number = 10000, spreadPips?: number, symbol?: string) {
    this.initialBalance = balance;
    this.balance = balance;
    this.peakEquity = balance;
    this.maxDrawdown = 0;
    this.maxDrawdownPercent = 0;
    this.openPositions = [];
    this.closedPositions = [];
    this.currentMarketPrice = 0;
    if (spreadPips !== undefined) {
      this.spread = Math.max(0, spreadPips);
    }
    if (symbol !== undefined) {
      this.assetSymbol = symbol;
      this.spec = getAssetSpec(symbol);
    }
  }

  public openMarketOrder(params: OpenOrderParams): Position {
    const id = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveSpread = params.spread !== undefined ? params.spread : this.spread;
    const spreadOffset = effectiveSpread / this.spec.pipScale;

    // BUY enters at Ask (price + spread), SELL enters at Bid (price)
    const entryPrice = params.type === 'BUY' ? params.price + spreadOffset : params.price;

    const position: Position = {
      id,
      type: params.type,
      volume: params.volume,
      entryPrice,
      entryTime: params.time,
      entryBarIndex: params.barIndex,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      currentPrice: entryPrice,
      unrealizedPnL: 0,
      pips: 0,
      status: 'OPEN',
      spread: effectiveSpread,
      setupTag: params.setupTag,
    };

    this.openPositions.push(position);
    this.updateMarketPrice(params.price);
    return position;
  }

  public moveToBreakEven(positionId: string): Position | null {
    const pos = this.openPositions.find((p) => p.id === positionId);
    if (!pos) return null;

    const posSpread = pos.spread !== undefined ? pos.spread : this.spread;
    const spreadOffset = posSpread / this.spec.pipScale;

    // Determine current valuation price (Bid for BUY, Ask for SELL)
    const currentValuationPrice =
      pos.type === 'SELL'
        ? (this.currentMarketPrice > 0 ? this.currentMarketPrice + spreadOffset : pos.currentPrice)
        : (this.currentMarketPrice > 0 ? this.currentMarketPrice : pos.currentPrice);

    // Position must be at break-even or in profit; cannot set SL at entry if currently in loss
    if (pos.type === 'BUY' && currentValuationPrice < pos.entryPrice) {
      return null;
    }
    if (pos.type === 'SELL' && currentValuationPrice > pos.entryPrice) {
      return null;
    }

    pos.stopLoss = pos.entryPrice;
    return pos;
  }

  public partialClosePosition(
    positionId: string,
    ratio: number = 0.5,
    exitPrice: number,
    exitTime: number
  ): { closedPosition: Position; remainingPosition: Position | null } | null {
    const index = this.openPositions.findIndex((p) => p.id === positionId);
    if (index === -1 || ratio <= 0) return null;

    const pos = this.openPositions[index];

    if (ratio >= 1.0) {
      const closed = this.closePosition(pos.id, exitPrice, exitTime, 'MANUAL');
      return closed ? { closedPosition: closed, remainingPosition: null } : null;
    }

    // Minimum lot size in gold trading is 0.01 lot. Cannot partially close a 0.01 lot position.
    if (pos.volume < 0.02) {
      return null;
    }

    const closedVolume = Math.round(pos.volume * ratio * 100) / 100;
    const remainingVolume = Math.round((pos.volume - closedVolume) * 100) / 100;

    if (closedVolume <= 0 || remainingVolume <= 0) return null;

    const posSpread = pos.spread !== undefined ? pos.spread : this.spread;
    const spreadOffset = posSpread / this.spec.pipScale;
    // BUY closes at Bid (exitPrice); SELL closes at Ask (exitPrice + spread)
    const effectiveExitPrice = pos.type === 'SELL' ? exitPrice + spreadOffset : exitPrice;
    const pnl = this.calculatePnL(pos.type, pos.entryPrice, effectiveExitPrice, closedVolume);
    const pips = this.calculatePips(pos.type, pos.entryPrice, effectiveExitPrice);

    const closedPart: Position = {
      id: `${pos.id}_part_${Date.now()}`,
      type: pos.type,
      volume: closedVolume,
      entryPrice: pos.entryPrice,
      entryTime: pos.entryTime,
      entryBarIndex: pos.entryBarIndex,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      currentPrice: effectiveExitPrice,
      exitPrice: effectiveExitPrice,
      exitTime,
      realizedPnL: pnl,
      pips,
      unrealizedPnL: 0,
      status: 'CLOSED_MANUAL',
      closeReason: `PARTIAL_${Math.round(ratio * 100)}%`,
      spread: posSpread,
    };

    this.balance += pnl;
    this.closedPositions.push(closedPart);

    if (remainingVolume > 0) {
      pos.volume = remainingVolume;
      const currentPrice = pos.type === 'SELL' ? exitPrice + spreadOffset : exitPrice;
      pos.currentPrice = currentPrice;
      pos.unrealizedPnL = this.calculatePnL(pos.type, pos.entryPrice, currentPrice, pos.volume);
      pos.pips = this.calculatePips(pos.type, pos.entryPrice, currentPrice);
      this.updateDrawdown();
      return { closedPosition: closedPart, remainingPosition: pos };
    } else {
      this.openPositions.splice(index, 1);
      this.updateDrawdown();
      return { closedPosition: closedPart, remainingPosition: null };
    }
  }

  public closePosition(
    positionId: string,
    exitPrice: number,
    exitTime: number,
    reason: 'MANUAL' | 'SL' | 'TP' = 'MANUAL'
  ): Position | null {
    const index = this.openPositions.findIndex((p) => p.id === positionId);
    if (index === -1) return null;

    const [pos] = this.openPositions.splice(index, 1);
    const posSpread = pos.spread !== undefined ? pos.spread : this.spread;
    const spreadOffset = posSpread / this.spec.pipScale;

    // In manual close: BUY closes at Bid, SELL closes at Ask
    // In SL/TP triggers: exitPrice is already the exact trigger fill price
    const effectiveExitPrice =
      reason === 'MANUAL' && pos.type === 'SELL' ? exitPrice + spreadOffset : exitPrice;

    const pnl = this.calculatePnL(pos.type, pos.entryPrice, effectiveExitPrice, pos.volume);
    const pips = this.calculatePips(pos.type, pos.entryPrice, effectiveExitPrice);

    pos.exitPrice = effectiveExitPrice;
    pos.exitTime = exitTime;
    pos.realizedPnL = pnl;
    pos.pips = pips;
    pos.unrealizedPnL = 0;
    pos.status = reason === 'SL' ? 'CLOSED_SL' : reason === 'TP' ? 'CLOSED_TP' : 'CLOSED_MANUAL';
    pos.closeReason = reason;

    this.balance += pnl;
    this.closedPositions.push(pos);
    this.updateDrawdown();

    return pos;
  }

  public updateMarketPrice(price: number): void {
    this.currentMarketPrice = price;
    for (const pos of this.openPositions) {
      const posSpread = pos.spread !== undefined ? pos.spread : this.spread;
      const spreadOffset = posSpread / this.spec.pipScale;
      // BUY valued at Bid (price), SELL valued at Ask (price + spread)
      const currentPrice = pos.type === 'SELL' ? price + spreadOffset : price;
      pos.currentPrice = currentPrice;
      pos.unrealizedPnL = this.calculatePnL(pos.type, pos.entryPrice, currentPrice, pos.volume);
      pos.pips = this.calculatePips(pos.type, pos.entryPrice, currentPrice);
    }
    this.updateDrawdown();
  }

  public processBarTriggers(bar: CandleBar): Position[] {
    const triggeredPositions: Position[] = [];
    const remainingPositions: Position[] = [];

    for (const pos of this.openPositions) {
      const posSpread = pos.spread !== undefined ? pos.spread : this.spread;
      const spreadOffset = posSpread / this.spec.pipScale;
      let triggered = false;
      let exitPrice = 0;
      let reason: 'SL' | 'TP' = 'SL';

      if (pos.type === 'BUY') {
        const hitSL = pos.stopLoss !== undefined && bar.low <= pos.stopLoss;
        const hitTP = pos.takeProfit !== undefined && bar.high >= pos.takeProfit;

        if (hitSL && hitTP) {
          triggered = true;
          exitPrice = pos.stopLoss!;
          reason = 'SL';
        } else if (hitSL) {
          triggered = true;
          exitPrice = pos.stopLoss!;
          reason = 'SL';
        } else if (hitTP) {
          triggered = true;
          exitPrice = pos.takeProfit!;
          reason = 'TP';
        }
      } else {
        // SELL triggers against Ask prices (Bid + spreadOffset)
        const askHigh = bar.high + spreadOffset;
        const askLow = bar.low + spreadOffset;
        const hitSL = pos.stopLoss !== undefined && askHigh >= pos.stopLoss;
        const hitTP = pos.takeProfit !== undefined && askLow <= pos.takeProfit;

        if (hitSL && hitTP) {
          triggered = true;
          exitPrice = pos.stopLoss!;
          reason = 'SL';
        } else if (hitSL) {
          triggered = true;
          exitPrice = pos.stopLoss!;
          reason = 'SL';
        } else if (hitTP) {
          triggered = true;
          exitPrice = pos.takeProfit!;
          reason = 'TP';
        }
      }

      if (triggered) {
        const pnl = this.calculatePnL(pos.type, pos.entryPrice, exitPrice, pos.volume);
        const pips = this.calculatePips(pos.type, pos.entryPrice, exitPrice);
        pos.exitPrice = exitPrice;
        pos.exitTime = bar.time;
        pos.realizedPnL = pnl;
        pos.pips = pips;
        pos.unrealizedPnL = 0;
        pos.status = reason === 'SL' ? 'CLOSED_SL' : 'CLOSED_TP';
        pos.closeReason = reason;

        this.balance += pnl;
        this.closedPositions.push(pos);
        triggeredPositions.push(pos);
      } else {
        // Update to bar close (Ask close for SELL, Bid close for BUY)
        const currentPrice = pos.type === 'SELL' ? bar.close + spreadOffset : bar.close;
        pos.currentPrice = currentPrice;
        pos.unrealizedPnL = this.calculatePnL(pos.type, pos.entryPrice, currentPrice, pos.volume);
        pos.pips = this.calculatePips(pos.type, pos.entryPrice, currentPrice);
        remainingPositions.push(pos);
      }
    }

    this.openPositions = remainingPositions;
    this.currentMarketPrice = bar.close;
    this.updateDrawdown();

    return triggeredPositions;
  }

  public calculatePnL(type: OrderType, entryPrice: number, currentPrice: number, volume: number): number {
    const multiplier = this.spec.multiplier;
    if (type === 'BUY') {
      return (currentPrice - entryPrice) * volume * multiplier;
    } else {
      return (entryPrice - currentPrice) * volume * multiplier;
    }
  }

  public calculatePips(type: OrderType, entryPrice: number, currentPrice: number): number {
    const pipScale = this.spec.pipScale;
    if (type === 'BUY') {
      return (currentPrice - entryPrice) * pipScale;
    } else {
      return (entryPrice - currentPrice) * pipScale;
    }
  }

  private updateDrawdown(): void {
    const equity = this.getEquity();
    if (equity > this.peakEquity) {
      this.peakEquity = equity;
    }

    const dd = this.peakEquity - equity;
    if (dd > this.maxDrawdown) {
      this.maxDrawdown = dd;
    }

    if (this.peakEquity > 0) {
      const ddPercent = (dd / this.peakEquity) * 100;
      if (ddPercent > this.maxDrawdownPercent) {
        this.maxDrawdownPercent = ddPercent;
      }
    }
  }

  public getCurrentMarketPrice(): number {
    return this.currentMarketPrice;
  }

  public getEquity(): number {
    const unrealized = this.openPositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
    return this.balance + unrealized;
  }

  public getState(): AccountState {
    const unrealizedPnL = this.openPositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
    const realizedPnL = this.balance - this.initialBalance;
    const equity = this.balance + unrealizedPnL;

    const tradeCount = this.closedPositions.length;
    let winCount = 0;
    let lossCount = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    for (const pos of this.closedPositions) {
      const pnl = pos.realizedPnL || 0;
      if (pnl > 0) {
        winCount++;
        grossProfit += pnl;
      } else if (pnl < 0) {
        lossCount++;
        grossLoss += Math.abs(pnl);
      }
    }

    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    return {
      initialBalance: this.initialBalance,
      balance: this.balance,
      equity,
      unrealizedPnL,
      realizedPnL,
      openPositions: [...this.openPositions],
      closedPositions: [...this.closedPositions],
      tradeCount,
      winCount,
      lossCount,
      winRate,
      profitFactor,
      maxDrawdown: this.maxDrawdown,
      maxDrawdownPercent: this.maxDrawdownPercent,
    };
  }
}
