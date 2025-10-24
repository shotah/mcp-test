/**
 * Pretty logging utility for the worker
 */
export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(
    level: string,
    message: string,
    data?: any
  ): string {
    const timestamp = this.formatTimestamp();
    const emoji = this.getEmoji(level);
    const baseMessage = `${emoji} [${timestamp}] ${message}`;

    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    return baseMessage;
  }

  private static getEmoji(level: string): string {
    const emojis: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      request: '🚀',
      response: '📤',
      auth: '🔐',
      database: '🗄️',
      ai: '🤖',
      cors: '🌐',
      rateLimit: '⏱️',
      debug: '🔍',
    };
    return emojis[level] || '📝';
  }

  static info(message: string, data?: any): void {
    console.log(this.formatMessage('info', message, data));
  }

  static success(message: string, data?: any): void {
    console.log(this.formatMessage('success', message, data));
  }

  static warning(message: string, data?: any): void {
    console.warn(this.formatMessage('warning', message, data));
  }

  static error(message: string, data?: any): void {
    console.error(this.formatMessage('error', message, data));
  }

  static request(method: string, pathname: string, data?: any): void {
    console.log(this.formatMessage('request', `${method} ${pathname}`, data));
  }

  static response(status: number, data?: any): void {
    console.log(this.formatMessage('response', `Response ${status}`, data));
  }

  static auth(message: string, data?: any): void {
    console.log(this.formatMessage('auth', message, data));
  }

  static database(message: string, data?: any): void {
    console.log(this.formatMessage('database', message, data));
  }

  static ai(message: string, data?: any): void {
    console.log(this.formatMessage('ai', message, data));
  }

  static cors(message: string, data?: any): void {
    console.log(this.formatMessage('cors', message, data));
  }

  static rateLimit(message: string, data?: any): void {
    console.log(this.formatMessage('rateLimit', message, data));
  }

  static debug(message: string, data?: any): void {
    console.log(this.formatMessage('debug', message, data));
  }
}
