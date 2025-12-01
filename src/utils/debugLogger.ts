// src/utils/debugLogger.ts

/**
 * Centralized debug logger for tracking renders and state changes
 * Use this to add verbose logging to any screen for debugging
 */

export class DebugLogger {
  private screenName: string;
  private renderCount: number = 0;
  private enabled: boolean = true; // Set to false to disable logging

  constructor(screenName: string, enabled: boolean = true) {
    this.screenName = screenName;
    this.enabled = enabled;
  }

  render(reason: string = 'unknown') {
    if (!this.enabled) return;
    this.renderCount++;
    console.log(`\n${this.getIcon()} ========== ${this.screenName} Render #${this.renderCount} (${reason}) ==========`);
  }

  state(label: string, value: any) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} [STATE] ${label}:`, value);
  }

  store(storeName: string, action: string) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} [STORE] ${storeName} - ${action}`);
  }

  effect(description: string) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} [EFFECT] ${description}`);
  }

  function(name: string, message: string) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} [FUNCTION] ${name}(): ${message}`);
  }

  user(action: string, detail?: string) {
    if (!this.enabled) return;
    const msg = detail ? `${action} - ${detail}` : action;
    console.log(`${this.getIcon()} [USER] ${msg}`);
  }

  render_phase(phase: string) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} [RENDER] ${phase}`);
  }

  success(message: string) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} ✅ ${message}`);
  }

  error(message: string, error?: any) {
    if (!this.enabled) return;
    console.error(`${this.getIcon()} ❌ ${message}`, error || '');
  }

  warn(message: string) {
    if (!this.enabled) return;
    console.warn(`${this.getIcon()} ⚠️ ${message}`);
  }

  info(message: string) {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} ℹ️ ${message}`);
  }

  separator() {
    if (!this.enabled) return;
    console.log(`${this.getIcon()} ${'─'.repeat(60)}`);
  }

  getRenderCount(): number {
    return this.renderCount;
  }

  private getIcon(): string {
    // Return emoji based on screen name
    const icons: Record<string, string> = {
      'HomeScreen': '🏠',
      'ConnectScreen': '🔌',
      'LoginScreen': '🔐',
      'LibraryDetailScreen': '📚',
      'SeriesDetailScreen': '📖',
      'ReaderScreen': '📄',
      'ImageReaderScreen': '🖼️',
      'EpubReaderScreen': '📘',
      'SettingsScreen': '⚙️',
    };
    return icons[this.screenName] || '📱';
  }
}

/**
 * Enable/disable all debug logging globally
 */
export const DEBUG_ENABLED = false; //__DEV__; // Only log in development

/**
 * Quick helper to create a logger for a screen
 */
export function createScreenLogger(screenName: string): DebugLogger {
  return new DebugLogger(screenName, DEBUG_ENABLED);
}