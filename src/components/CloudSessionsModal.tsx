import React, { useState, useEffect } from 'react';
import { X, Cloud, Share2, Trash2, Check, ExternalLink, Calendar, Plus } from 'lucide-react';
import { CloudSessionService } from '../core/CloudSessionService';
import { CloudSessionRecord } from '../types/cloud';
import { AccountState } from '../types/trade';
import { PropFirmState } from '../core/PropFirmEngine';
import { Timeframe } from '../types/candle';

interface CloudSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccountState: AccountState;
  currentPropFirmState: PropFirmState;
  currentSymbol: string;
  currentTimeframe: Timeframe;
  onLoadSession: (session: CloudSessionRecord) => void;
}

export const CloudSessionsModal: React.FC<CloudSessionsModalProps> = ({
  isOpen,
  onClose,
  currentAccountState,
  currentPropFirmState,
  currentSymbol,
  currentTimeframe,
  onLoadSession,
}) => {
  const [sessions, setSessions] = useState<CloudSessionRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const cloudService = CloudSessionService.getInstance();

  useEffect(() => {
    if (isOpen) {
      setSessions(cloudService.getSavedSessions());
      cloudService.fetchRemoteSessions().then((remoteList) => {
        if (remoteList && remoteList.length > 0) {
          setSessions(remoteList);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrentSession = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const title = newTitle.trim() || `${currentSymbol} ${currentTimeframe} Backtest Run`;
    cloudService.saveSession({
      title,
      symbol: currentSymbol,
      timeframe: currentTimeframe,
      mode: 'normal',
      accountState: currentAccountState,
      propFirmState: currentPropFirmState,
    });
    setSessions(cloudService.getSavedSessions());
    setNewTitle('');
    setIsSaving(false);
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Are you sure you want to delete this cloud session?')) {
      cloudService.deleteSession(id);
      setSessions(cloudService.getSavedSessions());
    }
  };

  const handleCopyShareLink = (session: CloudSessionRecord) => {
    const url = cloudService.generateShareableUrl(session);
    navigator.clipboard.writeText(url);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0d111a] border border-tv-border rounded-2xl shadow-2xl overflow-hidden p-6 text-tv-text max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-tv-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tv-blue/20 border border-tv-blue/30 flex items-center justify-center text-tv-blue">
              <Cloud size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cloud Replay Sessions</h2>
              <p className="text-xs text-tv-muted">
                Save, load, and share your backtest scenarios with coaches and peers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-tv-muted hover:text-white hover:bg-tv-border/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Save Current Session Form */}
        <form onSubmit={handleSaveCurrentSession} className="my-4 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Name this session (e.g. London Open Sweep + 3 Wins)"
            className="flex-1 bg-tv-bg border border-tv-border focus:border-tv-blue rounded-xl px-3 py-2 text-xs text-white placeholder-tv-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-tv-blue hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={14} />
            Save Current Run
          </button>
        </form>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-tv-muted">
              <Cloud size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No saved sessions yet</p>
              <p className="text-xs mt-1">Save your current backtest session above to sync it.</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isProfit = sess.netProfit >= 0;
              const formattedDate = new Date(sess.createdAt).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl bg-tv-surface/80 border border-tv-border hover:border-tv-muted transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{sess.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-tv-bg border border-tv-border text-tv-text font-mono">
                        {sess.symbol} {sess.timeframe}
                      </span>
                      {sess.isPropBreached && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                          BREACHED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <div>
                        <span className="text-[10px] text-tv-muted block">Net PnL</span>
                        <span
                          className={`font-bold font-mono ${
                            isProfit ? 'text-tv-green' : 'text-tv-red'
                          }`}
                        >
                          {isProfit ? '+' : ''}${sess.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-tv-muted block">Win Rate</span>
                        <span className="font-bold text-white">{sess.winRate.toFixed(1)}%</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-tv-muted block">Profit Factor</span>
                        <span className="font-bold text-white">
                          {sess.profitFactor >= 99 ? '∞' : sess.profitFactor.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-tv-muted block">Max DD</span>
                        <span className="font-bold text-tv-red">{sess.maxDrawdownPct.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-tv-muted">
                      <Calendar size={11} />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyShareLink(sess)}
                      title="Copy Share Link"
                      className="px-2.5 py-1.5 rounded-lg bg-tv-bg hover:bg-tv-border border border-tv-border text-xs text-tv-text hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedId === sess.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={13} />
                          <span>Share Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onLoadSession(sess);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-tv-blue hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Load</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      className="p-1.5 rounded-lg text-tv-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
