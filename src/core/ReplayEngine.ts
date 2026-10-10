import { CandleBar } from '../types/candle';
import { ScenarioMeta } from '../types/replay';

export class ReplayEngine {
  private allBars: CandleBar[] = [];
  private cursorIndex: number = -1;
  private startIndex: number = 0; // Starting index of current scenario
  private blindMode: boolean = false;
  private activeScenario?: ScenarioMeta;

  constructor() {}

  public loadDataset(bars: CandleBar[], initialContextBars: number = 50): void {
    this.allBars = bars;
    if (bars.length === 0) {
      this.cursorIndex = -1;
      this.startIndex = 0;
      return;
    }

    const context = Math.min(initialContextBars, bars.length);
    this.startIndex = 0;
    this.cursorIndex = context - 1;
    this.activeScenario = undefined;
  }

  public getVisibleBars(): CandleBar[] {
    if (this.cursorIndex < 0 || this.allBars.length === 0) return [];
    return this.allBars.slice(this.startIndex, this.cursorIndex + 1);
  }

  public getCurrentBar(): CandleBar | null {
    if (this.cursorIndex < 0 || this.cursorIndex >= this.allBars.length) return null;
    return this.allBars[this.cursorIndex];
  }

  public getCurrentCursor(): number {
    return this.cursorIndex;
  }

  public getTotalBars(): number {
    return this.allBars.length;
  }

  public getScenarioStartIndex(): number {
    return this.startIndex;
  }

  public nextStep(): CandleBar | null {
    if (this.cursorIndex + 1 >= this.allBars.length) {
      return null;
    }
    this.cursorIndex++;
    return this.allBars[this.cursorIndex];
  }

  public jumpToIndex(index: number): CandleBar | null {
    if (index < 0 || index >= this.allBars.length) return null;
    this.cursorIndex = index;
    if (this.cursorIndex < this.startIndex) {
      this.startIndex = Math.max(0, this.cursorIndex - 50);
    }
    return this.allBars[this.cursorIndex];
  }

  public jumpToDate(dateStr: string): CandleBar | null {
    const targetTime = new Date(dateStr).getTime() / 1000;
    if (isNaN(targetTime)) return null;

    // Binary search closest bar
    let low = 0;
    let high = this.allBars.length - 1;
    let bestIdx = 0;
    let minDiff = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const diff = Math.abs(this.allBars[mid].time - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = mid;
      }
      if (this.allBars[mid].time < targetTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    this.startIndex = Math.max(0, bestIdx - 50);
    this.cursorIndex = bestIdx;
    return this.allBars[this.cursorIndex];
  }

  public triggerRandomScenario(contextBars: number = 50): ScenarioMeta {
    if (this.allBars.length <= contextBars + 20) {
      this.startIndex = 0;
      this.cursorIndex = Math.min(contextBars - 1, this.allBars.length - 1);
      const scenario: ScenarioMeta = {
        id: `scen_${Date.now()}`,
        name: 'Default Session',
        startIndex: this.cursorIndex,
        startTimeIso: this.allBars[this.cursorIndex]?.rawTimeStr || '',
        contextBars: this.cursorIndex + 1,
      };
      this.activeScenario = scenario;
      return scenario;
    }

    // Pick random index ensuring at least contextBars before and at least 50 bars ahead for playing
    const minStart = contextBars;
    const maxStart = this.allBars.length - 50;
    const chosenIndex = Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;

    this.startIndex = chosenIndex - contextBars + 1;
    this.cursorIndex = chosenIndex;

    const chosenBar = this.allBars[chosenIndex];
    const scenario: ScenarioMeta = {
      id: `scen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Mystery Drill #${Math.floor(Math.random() * 900 + 100)}`,
      startIndex: chosenIndex,
      startTimeIso: chosenBar.rawTimeStr || new Date(chosenBar.time * 1000).toISOString(),
      contextBars,
    };

    this.activeScenario = scenario;
    return scenario;
  }

  public getActiveScenario(): ScenarioMeta | undefined {
    return this.activeScenario;
  }

  public isBlindMode(): boolean {
    return this.blindMode;
  }

  public toggleBlindMode(): boolean {
    this.blindMode = !this.blindMode;
    return this.blindMode;
  }

  public setBlindMode(enabled: boolean): void {
    this.blindMode = enabled;
  }

  public getAllBars(): CandleBar[] {
    return this.allBars;
  }
}
