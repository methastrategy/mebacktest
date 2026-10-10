import React from 'react';
import { X, Download, Percent, Award, ShieldAlert, BarChart3 } from 'lucide-react';
import { AccountState } from '../types/trade';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountState;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  if (!isOpen) return null;

  const exportCsv = () => {
    if (account.closedPositions.length === 0) return;

    const headers = ['Trade ID', 'Type', 'Volume', 'Entry Price', 'Exit Price', 'Realized PnL ($)', 'Pips', 'Setup Tag', 'Close Reason'];
    const rows = account.closedPositions.map((p) => [
      p.id,
      p.type,
      p.volume,
      p.entryPrice.toFixed(2),
      p.exitPrice?.toFixed(2) || '-',
      (p.realizedPnL || 0).toFixed(2),
      p.pips.toFixed(1),
      p.setupTag || 'Unspecified',
      p.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xauusd_replay_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isNetWin = account.realizedPnL >= 0;

  // Strategy Setup Breakdown
  const setupStats = React.useMemo(() => {
    const map = new Map<string, { count: number; wins: number; pnl: number }>();
    for (const p of account.closedPositions) {
      const tag = p.setupTag || 'Unspecified';
      const existing = map.get(tag) || { count: 0, wins: 0, pnl: 0 };
      existing.count++;
      if ((p.realizedPnL || 0) > 0) existing.wins++;
      existing.pnl += (p.realizedPnL || 0);
      map.set(tag, existing);
    }
    return Array.from(map.entries()).map(([tag, data]) => ({
      tag,
      count: data.count,
      winRate: (data.wins / data.count) * 100,
      pnl: data.pnl,
    }));
  }, [account.closedPositions]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-tv-surface border border-tv-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tv-border bg-tv-bg/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-tv-blue" size={20} />
            <h2 className="text-lg font-bold text-white">Backtest Performance & Trade Journal</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={account.closedPositions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tv-bg border border-tv-border hover:border-tv-muted text-tv-text text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-tv-muted hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-tv-bg border border-tv-border rounded-xl p-3.5 flex flex-col">
              <span className="text-xs text-tv-muted">Net Profit</span>
              <span className={`text-xl font-bold font-mono mt-1 ${isNetWin ? 'text-tv-green' : 'text-tv-red'}`}>
                {isNetWin ? '+' : ''}${account.realizedPnL.toFixed(2)}
              </span>
            </div>

            <div className="bg-tv-bg border border-tv-border rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tv-muted">Win Rate</span>
                <Percent size={14} className="text-amber-400" />
              </div>
              <span className="text-xl font-bold font-mono text-white mt-1">
                {account.winRate.toFixed(1)}%
              </span>
              <span className="text-[11px] text-tv-muted mt-0.5">
                {account.winCount} Wins / {account.lossCount} Losses
              </span>
            </div>

            <div className="bg-tv-bg border border-tv-border rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tv-muted">Profit Factor</span>
                <Award size={14} className="text-indigo-400" />
              </div>
              <span className="text-xl font-bold font-mono text-white mt-1">
                {account.profitFactor.toFixed(2)}
              </span>
              <span className="text-[11px] text-tv-muted mt-0.5">
                Total {account.tradeCount} trades
              </span>
            </div>

            <div className="bg-tv-bg border border-tv-border rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tv-muted">Max Drawdown</span>
                <ShieldAlert size={14} className="text-tv-red" />
              </div>
              <span className="text-xl font-bold font-mono text-tv-red mt-1">
                -${account.maxDrawdown.toFixed(2)}
              </span>
              <span className="text-[11px] text-tv-muted mt-0.5">
                {account.maxDrawdownPercent.toFixed(1)}% peak drop
              </span>
            </div>
          </div>

          {/* Strategy Setup Performance Breakdown */}
          {setupStats.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Strategy Setup Performance (Trade Model Analysis)</span>
              </h3>
              <div className="bg-tv-bg border border-tv-border rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-tv-surface/80 text-tv-muted uppercase font-mono text-[10px] border-b border-tv-border">
                    <tr>
                      <th className="py-2.5 px-3">Setup Model</th>
                      <th className="py-2.5 px-3">Trades</th>
                      <th className="py-2.5 px-3">Win Rate</th>
                      <th className="py-2.5 px-3">Net Profit ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tv-border font-mono">
                    {setupStats.map((item) => (
                      <tr key={item.tag} className="hover:bg-tv-surface/50 transition-colors">
                        <td className="py-2 px-3 font-sans font-semibold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>{item.tag}</span>
                        </td>
                        <td className="py-2 px-3 text-tv-text">{item.count}</td>
                        <td className="py-2 px-3 font-bold text-amber-300">{item.winRate.toFixed(1)}%</td>
                        <td className={`py-2 px-3 font-bold ${item.pnl >= 0 ? 'text-tv-green' : 'text-tv-red'}`}>
                          {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trade History Table */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-white">Closed Trades History</h3>
            {account.closedPositions.length === 0 ? (
              <div className="bg-tv-bg border border-tv-border rounded-xl p-8 text-center text-tv-muted text-xs">
                No closed trades yet in this session.
              </div>
            ) : (
              <div className="bg-tv-bg border border-tv-border rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-tv-surface/80 text-tv-muted uppercase font-mono text-[10px] border-b border-tv-border">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Lots</th>
                      <th className="py-2.5 px-3">Entry</th>
                      <th className="py-2.5 px-3">Exit</th>
                      <th className="py-2.5 px-3">Pips</th>
                      <th className="py-2.5 px-3">Setup Tag</th>
                      <th className="py-2.5 px-3">PnL ($)</th>
                      <th className="py-2.5 px-3">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tv-border font-mono">
                    {account.closedPositions.map((p) => {
                      const isWin = (p.realizedPnL || 0) >= 0;
                      return (
                        <tr key={p.id} className="hover:bg-tv-surface/50 transition-colors">
                          <td className="py-2 px-3 font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                p.type === 'BUY'
                                  ? 'bg-tv-green/20 text-tv-green'
                                  : 'bg-tv-red/20 text-tv-red'
                              }`}
                            >
                              {p.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-white">{p.volume}</td>
                          <td className="py-2 px-3 text-tv-text">{p.entryPrice.toFixed(2)}</td>
                          <td className="py-2 px-3 text-tv-text">{p.exitPrice?.toFixed(2) || '-'}</td>
                          <td className={`py-2 px-3 ${isWin ? 'text-tv-green' : 'text-tv-red'}`}>
                            {p.pips >= 0 ? '+' : ''}{p.pips.toFixed(1)}p
                          </td>
                          <td className="py-2 px-3 text-indigo-300 font-sans text-[11px] font-medium">
                            {p.setupTag || '-'}
                          </td>
                          <td className={`py-2 px-3 font-bold ${isWin ? 'text-tv-green' : 'text-tv-red'}`}>
                            {isWin ? '+' : ''}${ (p.realizedPnL || 0).toFixed(2) }
                          </td>
                          <td className="py-2 px-3 text-tv-muted text-[11px]">
                            {p.status === 'CLOSED_SL' ? (
                              <span className="text-tv-red">Hit SL</span>
                            ) : p.status === 'CLOSED_TP' ? (
                              <span className="text-tv-green">Hit TP</span>
                            ) : p.closeReason?.startsWith('PARTIAL_') ? (
                              <span className="text-blue-400 font-semibold">
                                Partial ({p.closeReason.replace('PARTIAL_', '')})
                              </span>
                            ) : (
                              <span>Manual Close</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
