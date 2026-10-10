export type OrderType = 'BUY' | 'SELL';

export type PositionStatus = 'OPEN' | 'CLOSED_SL' | 'CLOSED_TP' | 'CLOSED_MANUAL';

export interface Position {
  id: string;
  type: OrderType;
  volume: number;          // Lot size e.g. 0.1, 1.0
  entryPrice: number;
  entryTime: number;       // Unix timestamp in seconds
  entryBarIndex: number;
  stopLoss?: number;
  takeProfit?: number;
  currentPrice: number;
  unrealizedPnL: number;
  pips: number;
  status: PositionStatus;
  exitPrice?: number;
  exitTime?: number;
  realizedPnL?: number;
  closeReason?: string;
  spread?: number;
  setupTag?: string;
  symbol?: string;
}

export interface AccountState {
  initialBalance: number;
  balance: number;
  equity: number;
  unrealizedPnL: number;
  realizedPnL: number;
  openPositions: Position[];
  closedPositions: Position[];
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
}
