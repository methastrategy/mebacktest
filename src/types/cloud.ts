import { AccountState } from './trade';
import { PropFirmState } from '../core/PropFirmEngine';
import { Timeframe } from './candle';

export interface CloudSessionRecord {
  id: string;
  userId: string;
  title: string;
  symbol: string;
  timeframe: Timeframe;
  mode: 'normal' | 'blind' | 'prop_firm';
  initialBalance: number;
  finalEquity: number;
  netProfit: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  isPropBreached: boolean;
  shareSlug: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  accountState: AccountState;
  propFirmState: PropFirmState;
  drawingsCount: number;
}

export interface CloudTradeRecord {
  id: string;
  sessionId: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  realizedPnL: number;
  pips: number;
  closeReason: string;
  setupTag?: string;
  notes?: string;
  entryTime: number;
  exitTime: number;
  createdAt: number;
}
