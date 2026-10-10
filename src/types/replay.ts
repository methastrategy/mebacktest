export interface ScenarioMeta {
  id: string;
  name: string;
  startIndex: number;
  startTimeIso: string;
  contextBars: number;
}

export interface ReplayState {
  cursorIndex: number;
  totalBars: number;
  isPlaying: boolean;
  speedMs: number;
  isBlindMode: boolean;
  activeScenario?: ScenarioMeta;
}
