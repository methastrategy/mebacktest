import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Dices,
  Eye,
  EyeOff,
  Calendar,
  Gauge,
  HelpCircle,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { ScenarioMeta } from '../types/replay';

interface ReplayControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  onRandomScenario: () => void;
  isBlindMode: boolean;
  onToggleBlindMode: () => void;
  onJumpToDate: (dateStr: string) => void;
  cursorIndex: number;
  totalBars: number;
  activeScenario?: ScenarioMeta;
  onOpenHelp: () => void;
}

const SPEED_OPTIONS = [
  { label: '0.1s', ms: 100 },
  { label: '0.25s', ms: 250 },
  { label: '0.5s', ms: 500 },
  { label: '1.0s', ms: 1000 },
  { label: '2.0s', ms: 2000 },
];

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  speedMs,
  onChangeSpeed,
  onRandomScenario,
  isBlindMode,
  onToggleBlindMode,
  onJumpToDate,
  cursorIndex,
  totalBars,
  activeScenario,
  onOpenHelp,
}) => {
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-05-06T08:00');

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.findIndex((o) => o.ms === speedMs);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    onChangeSpeed(SPEED_OPTIONS[nextIndex].ms);
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      onJumpToDate(selectedDate);
      setShowDatePicker(false);
    }
  };

  return (
    <div className="relative select-none max-w-[calc(100vw-1.5rem)]">
      {/* Mobile Secondary Tools Tray (Opens when tapping ••• on mobile) */}
      {showMobileTools && (
        <div className="sm:hidden absolute bottom-14 left-1/2 -translate-x-1/2 z-40 bg-tv-surface/98 border border-tv-border p-2 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-fade-in w-max max-w-[95vw]">
          {/* Random Scenario */}
          <button
            onClick={() => {
              onRandomScenario();
              setShowMobileTools(false);
            }}
            title="สุ่มช่วงเวลาและสถานการณ์ใหม่"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold"
          >
            <Dices size={14} />
            <span>สุ่ม</span>
          </button>

          {/* Blind Mode */}
          <button
            onClick={() => {
              onToggleBlindMode();
              setShowMobileTools(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
              isBlindMode
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-200'
                : 'bg-tv-bg border-tv-border text-tv-muted hover:text-tv-text'
            }`}
          >
            {isBlindMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{isBlindMode ? 'Blind ON' : 'Blind'}</span>
          </button>

          {/* Jump To Date */}
          <button
            onClick={() => {
              setShowDatePicker(true);
              setShowMobileTools(false);
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-tv-bg border border-tv-border text-tv-text text-xs"
          >
            <Calendar size={13} className="text-tv-muted" />
            <span>วันที่</span>
          </button>

          {/* Help */}
          <button
            onClick={() => {
              onOpenHelp();
              setShowMobileTools(false);
            }}
            className="p-1.5 text-tv-muted hover:text-white"
          >
            <HelpCircle size={15} />
          </button>

          <button
            onClick={() => setShowMobileTools(false)}
            className="p-1 text-tv-muted hover:text-white ml-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Single-Line Replay Bar */}
      <div className="bg-tv-surface/95 backdrop-blur-md border border-tv-border px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-2xl flex items-center justify-center gap-1.5 sm:gap-3">
        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause Replay (Space)' : 'Play Replay (Space)'}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/40'
              : 'bg-tv-blue hover:bg-blue-600 text-white'
          }`}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* Step Next Bar */}
        <button
          onClick={onStepForward}
          title="Next Bar (Spacebar / Right Arrow)"
          disabled={isPlaying || cursorIndex >= totalBars - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tv-border/80 hover:bg-tv-border text-tv-text hover:text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 active:scale-95"
        >
          <SkipForward size={15} />
          <span>Step Bar</span>
        </button>

        {/* Mobile Speed Cycle Button (< sm) */}
        <button
          onClick={cycleSpeed}
          title="แตะเพื่อเปลี่ยนความเร็ว Replay"
          className="sm:hidden px-2 py-1.5 rounded-xl bg-tv-bg/90 border border-tv-border text-xs font-mono font-bold text-amber-400 active:scale-95"
        >
          ⚡ {SPEED_OPTIONS.find((o) => o.ms === speedMs)?.label || '0.5s'}
        </button>

        {/* Desktop Speed Selector (sm:) */}
        <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 bg-tv-bg/80 border border-tv-border px-1.5 sm:px-2 py-1 rounded-xl">
          <Gauge size={13} className="text-tv-muted mr-0.5" />
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              onClick={() => onChangeSpeed(opt.ms)}
              className={`px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono transition-colors ${
                speedMs === opt.ms
                  ? 'bg-tv-blue text-white font-bold'
                  : 'text-tv-muted hover:text-tv-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-tv-border mx-0.5 hidden sm:block" />

        {/* Desktop-only: Random Scenario */}
        <button
          onClick={onRandomScenario}
          title="สุ่มช่วงเวลาและสถานการณ์ใหม่ (Random Scenario Drill)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-purple-500/20 active:scale-95"
        >
          <Dices size={15} className="animate-spin-once" />
          <span>สุ่มสถานการณ์</span>
        </button>

        {/* Desktop-only: Blind Mode */}
        <button
          onClick={onToggleBlindMode}
          title={isBlindMode ? 'ปิด Blind Mode (แสดงวันที่)' : 'เปิด Blind Mode (ซ่อนวันที่เพื่อฝึกฝน)'}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
            isBlindMode
              ? 'bg-purple-950/80 border-purple-500/80 text-purple-200'
              : 'bg-tv-bg border-tv-border text-tv-muted hover:text-tv-text'
          }`}
        >
          {isBlindMode ? <EyeOff size={15} /> : <Eye size={15} />}
          <span>{isBlindMode ? 'Blind Mode: ON' : 'Blind Mode: OFF'}</span>
        </button>

        {/* Desktop-only: Jump To Date */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="เลือกวันที่และเวลาเจาะจง (Jump to Date)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-tv-bg border border-tv-border hover:border-tv-muted text-tv-text text-xs sm:text-sm transition-colors"
          >
            <Calendar size={14} className="text-tv-muted" />
            <span>เลือกวันที่</span>
          </button>
        </div>

        <div className="h-5 w-px bg-tv-border mx-0.5" />

        {/* Counter & Status */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-tv-muted hidden xs:inline">Bar:</span>
          <span className="text-amber-400 font-bold">{cursorIndex >= 0 ? cursorIndex + 1 : 0}</span>
          <span className="text-tv-muted">/</span>
          <span className="text-tv-muted">{totalBars}</span>

          {activeScenario && (
            <span className="hidden md:inline ml-1 bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-[11px] border border-purple-500/30 truncate max-w-[120px]">
              {activeScenario.name}
            </span>
          )}
        </div>

        {/* Mobile Tools (•••) Button */}
        <button
          onClick={() => setShowMobileTools((prev) => !prev)}
          title="เครื่องมือเพิ่มเติม (Random, Blind Mode, Date)"
          className={`sm:hidden p-1.5 rounded-xl border transition-colors ${
            showMobileTools
              ? 'bg-tv-blue text-white border-tv-blue'
              : 'bg-tv-bg border-tv-border text-tv-muted hover:text-white'
          }`}
        >
          <MoreHorizontal size={15} />
        </button>

        {/* Desktop Help Shortcuts Button */}
        <button
          onClick={onOpenHelp}
          title="Keyboard Shortcuts & Manual"
          className="hidden sm:block ml-auto text-tv-muted hover:text-tv-text transition-colors p-1"
        >
          <HelpCircle size={17} />
        </button>
      </div>

      {/* Jump Date Modal with Backdrop */}
      {showDatePicker && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowDatePicker(false)}
          />
          <form
            onSubmit={handleDateSubmit}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 sm:left-auto sm:right-10 z-50 bg-tv-surface border border-tv-border p-3 rounded-2xl shadow-2xl flex flex-col gap-2 w-72 backdrop-blur-xl"
          >
            <div className="flex justify-between items-center pb-1 border-b border-tv-border">
              <label className="text-xs font-semibold text-white">ระบุวันที่และเวลาที่ต้องการไป:</label>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="text-tv-muted hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-tv-bg border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-text focus:outline-none focus:border-tv-blue font-mono"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="px-2.5 py-1 text-xs text-tv-muted hover:text-tv-text"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-tv-blue hover:bg-blue-600 text-white rounded text-xs font-medium"
              >
                กระโดดไป
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
