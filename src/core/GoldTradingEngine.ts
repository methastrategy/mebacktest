import { CandleBar } from '../types/candle';
import { AccountState, OrderType, Position } from '../types/trade';

export interface OpenOrderParams {
  type: OrderType;
  volume: number;
  price: number;
  time: number;
  barIndex: number;
  stopLoss?: number;
  takeProfit?: number;
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

  constructor(initialBalance: number = 10000) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.peakEquity = initialBalance;
    this.maxDrawdown = 0;
    this.maxDrawdownPercent = 0;
  }

  public reset(balance: number = 10000) {
    this.initialBalance = balance;
    this.balance = balance;
    this.peakEquity = balance;
    this.maxDrawdown = 0;
    this.maxDrawdownPercent = 0;
    this.openPositions = [];
    this.closedPositions = [];
    this.currentMarketPrice = 0;
  }

  public openMarketOrder(params: OpenOrderParams): Position {
    const id = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const position: Position = {
      id,
      type: params.type,
      volume: params.volume,
      entryPrice: params.price,
      entryTime: params.time,
      entryBarIndex: params.barIndex,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      currentPrice: params.price,
      unrealizedPnL: 0,
      pips: 0,
      status: 'OPEN',
    };

    this.openPositions.push(position);
    this.updateMarketPrice(params.price);
    return position;
  }

  public closePosition(positionId: string, exitPrice: number, exitTime: number, reason: 'MANUAL' | 'SL' | 'TP' = 'MANUAL'): Position | null {
    const index = this.openPositions.findIndex((p) => p.id === positionId);
    if (index === -1) return null;

    const [pos] = this.openPositions.splice(index, 1);
    const pnl = this.calculatePnL(pos.type, pos.entryPrice, exitPrice, pos.volume);
    const pips = this.calculatePips(pos.type, pos.entryPrice, exitPrice);

    pos.exitPrice = exitPrice;
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
      pos.currentPrice = price;
      pos.unrealizedPnL = this.calculatePnL(pos.type, pos.entryPrice, price, pos.volume);
      pos.pips = this.calculatePips(pos.type, pos.entryPrice, price);
    }
    this.updateDrawdown();
  }

  public processBarTriggers(bar: CandleBar): Position[] {
    const triggeredPositions: Position[] = [];
    const remainingPositions: Position[] = [];

    for (const pos of this.openPositions) {
      let triggered = false;
      let exitPrice = 0;
      let reason: 'SL' | 'TP' = 'SL';

      if (pos.type === 'BUY') {
        const hitSL = pos.stopLoss !== undefined && bar.low <= pos.stopLoss;
        const hitTP = pos.takeProfit !== undefined && bar.high >= pos.takeProfit;

        if (hitSL && hitTP) {
          // Conservative risk: trigger SL
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
        // SELL
        const hitSL = pos.stopLoss !== undefined && bar.high >= pos.stopLoss;
        const hitTP = pos.takeProfit !== undefined && bar.low <= pos.takeProfit;

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
        // Update to bar close
        pos.currentPrice = bar.close;
        pos.unrealizedPnL = this.calculatePnL(pos.type, pos.entryPrice, bar.close, pos.volume);
        pos.pips = this.calculatePips(pos.type, pos.entryPrice, bar.close);
        remainingPositions.push(pos);
      }
    }

    this.openPositions = remainingPositions;
    this.currentMarketPrice = bar.close;
    this.updateDrawdown();

    return triggeredPositions;
  }

  public calculatePnL(type: OrderType, entryPrice: number, currentPrice: number, volume: number): number {
    // 1 standard lot gold = 100 oz. $1 change = $100 per lot.
    const multiplier = 100.0;
    if (type === 'BUY') {
      return (currentPrice - entryPrice) * volume * multiplier;
    } else {
      return (entryPrice - currentPrice) * volume * multiplier;
    }
  }

  public calculatePips(type: OrderType, entryPrice: number, currentPrice: number): number {
    // In Gold, $1.00 move is 100 pips ($0.01 = 1 pip)
    const pipScale = 100.0;
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
