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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-05-06T08:00');

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      onJumpToDate(selectedDate);
      setShowDatePicker(false);
    }
  };

  return (
    <div className="bg-tv-surface/95 backdrop-blur-md border border-tv-border px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 select-none max-w-[calc(100vw-1.5rem)]">
      {/* Play / Pause */}
      <button
        onClick={onTogglePlay}
        title={isPlaying ? 'Pause Replay (Space)' : 'Play Replay (Space)'}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
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
        className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-tv-border/80 hover:bg-tv-border text-tv-text hover:text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 active:scale-95"
      >
        <SkipForward size={15} />
        <span>Step Bar</span>
      </button>

      {/* Speed Selector */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-tv-bg/80 border border-tv-border px-1.5 sm:px-2 py-1 rounded-xl">
        <Gauge size={13} className="text-tv-muted mr-0.5 hidden xs:inline" />
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

      {/* Random Scenario (Mystery Drill) */}
      <button
        onClick={onRandomScenario}
        title="สุ่มช่วงเวลาและสถานการณ์ใหม่ (Random Scenario Drill)"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-purple-500/20 active:scale-95"
      >
        <Dices size={15} className="animate-spin-once" />
        <span className="hidden xs:inline sm:inline">สุ่มสถานการณ์</span>
        <span className="xs:hidden sm:hidden">สุ่ม</span>
      </button>

      {/* Blind Mode Toggle */}
      <button
        onClick={onToggleBlindMode}
        title={isBlindMode ? 'ปิด Blind Mode (แสดงวันที่)' : 'เปิด Blind Mode (ซ่อนวันที่เพื่อฝึกฝน)'}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
          isBlindMode
            ? 'bg-purple-950/80 border-purple-500/80 text-purple-200'
            : 'bg-tv-bg border-tv-border text-tv-muted hover:text-tv-text'
        }`}
      >
        {isBlindMode ? <EyeOff size={15} /> : <Eye size={15} />}
        <span className="hidden sm:inline">{isBlindMode ? 'Blind Mode: ON' : 'Blind Mode: OFF'}</span>
        <span className="sm:hidden">{isBlindMode ? 'Blind ON' : 'Blind'}</span>
      </button>

      {/* Jump To Date (Pop-up) */}
      <div className="relative">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          title="เลือกวันที่และเวลาเจาะจง (Jump to Date)"
          className="flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-xl bg-tv-bg border border-tv-border hover:border-tv-muted text-tv-text text-xs sm:text-sm transition-colors"
        >
          <Calendar size={14} className="text-tv-muted" />
          <span className="hidden sm:inline">เลือกวันที่</span>
        </button>

        {showDatePicker && (
          <form
            onSubmit={handleDateSubmit}
            className="absolute bottom-12 left-0 z-50 bg-tv-surface border border-tv-border p-3 rounded-xl shadow-2xl flex flex-col gap-2 w-64"
          >
            <label className="text-xs font-semibold text-tv-muted">ระบุวันที่และเวลาที่ต้องการไป:</label>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-tv-bg border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-text focus:outline-none focus:border-tv-blue"
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
        )}
      </div>

      <div className="h-5 w-px bg-tv-border mx-1" />

      {/* Counter & Status */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-tv-muted">Bar:</span>
        <span className="text-amber-400 font-bold">{cursorIndex >= 0 ? cursorIndex + 1 : 0}</span>
        <span className="text-tv-muted">/</span>
        <span className="text-tv-muted">{totalBars}</span>

        {activeScenario && (
          <span className="ml-1 bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-[11px] border border-purple-500/30">
            {activeScenario.name}
          </span>
        )}
      </div>

      {/* Shortcuts Help */}
      <button
        onClick={onOpenHelp}
        title="Keyboard Shortcuts & Manual"
        className="ml-auto text-tv-muted hover:text-tv-text transition-colors p-1"
      >
        <HelpCircle size={17} />
      </button>
    </div>
  );
};
