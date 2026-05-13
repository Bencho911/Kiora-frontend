export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
}

export class LogService {
  private readonly MAX_LOGS = 100;
  private readonly STORAGE_KEY = 'kiora_logs';

  error(message: string, context?: any) {
    this.addLog('error', message, context);
  }

  warn(message: string, context?: any) {
    this.addLog('warn', message, context);
  }

  info(message: string, context?: any) {
    this.addLog('info', message, context);
  }

  initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.onerror = (message, source, lineno, colno, error) => {
      this.error(`Uncaught Error: ${message}`, { source, lineno, colno, stack: error?.stack });
    };

    window.onunhandledrejection = (event) => {
      this.error(`Unhandled Rejection: ${event.reason}`, { reason: event.reason });
    };

    console.info('[KIORA] Global error handlers initialized');
  }

  exportLogs() {
    if (typeof window === 'undefined') return;
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiora_logs_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private addLog(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context)
    };

    // Output to console for developers
    if (level === 'error') {
      console.error(`[KIORA ERROR] ${message}`, context);
    } else if (level === 'warn') {
      console.warn(`[KIORA WARN] ${message}`, context);
    } else {
      console.log(`[KIORA INFO] ${message}`, context);
    }

    if (typeof window === 'undefined') return;

    try {
      const logs = this.getLogs();
      logs.push(entry);
      
      // Keep only last N logs
      const trimmedLogs = logs.slice(-this.MAX_LOGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (e) {
      console.warn('Could not save log to localStorage', e);
    }
  }

  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearLogs() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private sanitizeContext(context: any): any {
    if (!context) return undefined;
    try {
      // Avoid circular references and extremely large objects
      return JSON.parse(JSON.stringify(context));
    } catch {
      return '[Non-serializable context]';
    }
  }
}
