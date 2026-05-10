/**
 * 结构化日志
 *
 * 轻量级日志封装，支持不同级别和结构化输出。
 * 生产环境可接入 pino 或其他日志服务。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: string;
    data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const MIN_LEVEL: LogLevel =
    process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, data } = entry;
    const prefix = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}${dataStr}`;
}

function log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>) {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        data,
    };

    const formatted = formatEntry(entry);

    switch (level) {
        case 'debug':
            console.debug(formatted);
            break;
        case 'info':
            console.log(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'error':
            console.error(formatted);
            break;
    }
}

export const logger = {
    debug: (message: string, context?: string, data?: Record<string, unknown>) =>
        log('debug', message, context, data),

    info: (message: string, context?: string, data?: Record<string, unknown>) =>
        log('info', message, context, data),

    warn: (message: string, context?: string, data?: Record<string, unknown>) =>
        log('warn', message, context, data),

    error: (message: string, context?: string, data?: Record<string, unknown>) =>
        log('error', message, context, data),
};

/**
 * 性能计时器
 *
 * @example
 * const timer = createTimer('db-query');
 * const result = await prisma.dish.findMany();
 * timer.end({ count: result.length });
 */
export function createTimer(label: string) {
    const start = performance.now();
    return {
        end(data?: Record<string, unknown>) {
            const duration = Math.round(performance.now() - start);
            logger.debug(`${label} completed in ${duration}ms`, 'perf', data);
            return duration;
        },
    };
}
