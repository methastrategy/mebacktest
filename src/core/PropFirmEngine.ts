export type PropChallengeStatus = 'ACTIVE' | 'PASSED' | 'BREACHED_DAILY' | 'BREACHED_TOTAL';

export interface PropFirmConfig {
  initialBalance: number;
  maxDailyLossPercent?: number; // e.g. 5.0%
  maxTotalLossPercent?: number; // e.g. 10.0%
  targetProfitPercent?: number; // e.g. 8.0%
}

export interface PropFirmState {
  status: PropChallengeStatus;
  initialBalance: number;
  currentEquity: number;
  currentBalance: number;
  dayStartBalance: number;
  dailyLossAmount: number;
  dailyLossPercent: number;
  dailyLossLimitAmount: number;
  totalLossAmount: number;
  totalLossPercent: number;
  totalLossLimitAmount: number;
  profitAmount: number;
  profitPercent: number;
  profitTargetAmount: number;
  breachReason?: string;
}

export class PropFirmEngine {
  private initialBalance: number;
  private maxDailyLossPercent: number;
  private maxTotalLossPercent: number;
  private targetProfitPercent: number;

  private currentEquity: number;
  private currentBalance: number;
  private dayStartBalance: number;
  private lastDayIdentifier: string = '';
  private status: PropChallengeStatus = 'ACTIVE';
  private breachReason?: string;

  constructor(config: PropFirmConfig) {
    this.initialBalance = config.initialBalance;
    this.maxDailyLossPercent = config.maxDailyLossPercent ?? 5.0;
    this.maxTotalLossPercent = config.maxTotalLossPercent ?? 10.0;
    this.targetProfitPercent = config.targetProfitPercent ?? 8.0;

    this.currentEquity = this.initialBalance;
    this.currentBalance = this.initialBalance;
    this.dayStartBalance = this.initialBalance;
  }

  public reset(initialBalance?: number): void {
    if (initialBalance !== undefined) {
      this.initialBalance = initialBalance;
    }
    this.currentEquity = this.initialBalance;
    this.currentBalance = this.initialBalance;
    this.dayStartBalance = this.initialBalance;
    this.lastDayIdentifier = '';
    this.status = 'ACTIVE';
    this.breachReason = undefined;
  }

  public updateEquity(equity: number, balance: number, timestampSeconds: number): PropFirmState {
    this.currentEquity = equity;
    this.currentBalance = balance;

    // Check Day Boundary (UTC Day)
    const dateObj = new Date(timestampSeconds * 1000);
    const dayIdentifier = `${dateObj.getUTCFullYear()}-${dateObj.getUTCMonth() + 1}-${dateObj.getUTCDate()}`;

    if (this.lastDayIdentifier && this.lastDayIdentifier !== dayIdentifier) {
      // New trading day starts: baseline is previous day-end balance
      this.dayStartBalance = balance;
    }
    this.lastDayIdentifier = dayIdentifier;

    if (this.status === 'BREACHED_DAILY' || this.status === 'BREACHED_TOTAL') {
      return this.getStatus();
    }

    const dailyLimitAmount = (this.initialBalance * this.maxDailyLossPercent) / 100.0;
    const totalLimitAmount = (this.initialBalance * this.maxTotalLossPercent) / 100.0;
    const targetAmount = (this.initialBalance * this.targetProfitPercent) / 100.0;

    // Intraday loss from day start balance
    const currentDailyDrop = Math.max(0, this.dayStartBalance - equity);
    // Total loss from initial balance
    const currentTotalDrop = Math.max(0, this.initialBalance - equity);

    // Rule 1: Max Total Drawdown Breach
    if (currentTotalDrop >= totalLimitAmount) {
      this.status = 'BREACHED_TOTAL';
      this.breachReason = `Max Total Loss Limit Exceeded: -$${currentTotalDrop.toFixed(2)} (Limit: -$${totalLimitAmount.toFixed(2)})`;
      return this.getStatus();
    }

    // Rule 2: Max Daily Drawdown Breach
    if (currentDailyDrop >= dailyLimitAmount) {
      this.status = 'BREACHED_DAILY';
      this.breachReason = `Max Daily Loss Limit Exceeded: -$${currentDailyDrop.toFixed(2)} (Limit: -$${dailyLimitAmount.toFixed(2)})`;
      return this.getStatus();
    }

    // Rule 3: Profit Target Passed
    const profit = equity - this.initialBalance;
    if (profit >= targetAmount) {
      this.status = 'PASSED';
      return this.getStatus();
    }

    this.status = 'ACTIVE';
    return this.getStatus();
  }

  public getStatus(): PropFirmState {
    const dailyLimitAmount = (this.initialBalance * this.maxDailyLossPercent) / 100.0;
    const totalLimitAmount = (this.initialBalance * this.maxTotalLossPercent) / 100.0;
    const targetAmount = (this.initialBalance * this.targetProfitPercent) / 100.0;

    const dailyLossAmount = Math.max(0, this.dayStartBalance - this.currentEquity);
    const dailyLossPercent = (dailyLossAmount / this.initialBalance) * 100.0;

    const totalLossAmount = Math.max(0, this.initialBalance - this.currentEquity);
    const totalLossPercent = (totalLossAmount / this.initialBalance) * 100.0;

    const profitAmount = this.currentEquity - this.initialBalance;
    const profitPercent = (profitAmount / this.initialBalance) * 100.0;

    return {
      status: this.status,
      initialBalance: this.initialBalance,
      currentEquity: this.currentEquity,
      currentBalance: this.currentBalance,
      dayStartBalance: this.dayStartBalance,
      dailyLossAmount,
      dailyLossPercent,
      dailyLossLimitAmount: dailyLimitAmount,
      totalLossAmount,
      totalLossPercent,
      totalLossLimitAmount: totalLimitAmount,
      profitAmount,
      profitPercent,
      profitTargetAmount: targetAmount,
      breachReason: this.breachReason,
    };
  }
}
