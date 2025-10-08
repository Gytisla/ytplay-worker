/**
 * Structured JSON logger used by workers and server code.
 * Minimal and dependency-free so it works in Deno/Node environments.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function envGet(key: string): string | undefined {
  try {
    // Deno
    // @ts-ignore
    if (typeof Deno !== 'undefined' && Deno?.env?.get) return Deno.env.get(key)
    // Node
    // @ts-ignore
    if (typeof process !== 'undefined' && process?.env) return process.env[key]
  } catch {
    // ignore restricted envs
  }
  return (globalThis as any).__ENV?.[key]
}

export interface LogMeta { [key: string]: unknown }

export interface Logger {
  child: (ctx: LogMeta) => Logger
  debug: (msg: string, meta?: LogMeta) => void
  info: (msg: string, meta?: LogMeta) => void
  warn: (msg: string, meta?: LogMeta) => void
  error: (msg: string, meta?: LogMeta) => void
  setLevel: (level: LogLevel) => void
  setHook: (hook?: (entry: Record<string, unknown>) => void) => void
}

export function createLogger(defaultCtx: LogMeta = {}): Logger {
  let level: LogLevel = (envGet('LOG_LEVEL') as LogLevel) ?? 'info'
  let hook: ((entry: Record<string, unknown>) => void) | undefined

  function shouldLog(l: LogLevel) {
    return LEVELS[l] >= LEVELS[level]
  }

    function baseEntry(l: LogLevel, msg: string, meta?: LogMeta, ctx?: LogMeta) {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level: l,
      msg,
      ...(defaultCtx ?? {}),
      ...(ctx ?? {}),
      ...(meta ?? {}),
    }
    if (!('service' in entry)) entry['service'] = 'ytplay-worker'
    return entry
  }

  function output(entry: Record<string, unknown>) {
    try {
      const s = JSON.stringify(entry)
  if ((entry['level'] as string) === 'error') console.error(s)
  else if ((entry['level'] as string) === 'warn') console.warn(s)
  else console.log(s)
      if (hook) {
        try { hook(entry) } catch { /* swallow */ }
      }
    } catch (err) {
      console.log('log-fallback', entry, err)
    }
  }

  function makeChild(ctx: LogMeta = {}): Logger {
    const childDefault = { ...defaultCtx, ...ctx }
    const child = createLogger(childDefault)
    child.setLevel(level)
    child.setHook(hook)
    return child
  }

  return {
    child: (ctx: LogMeta) => makeChild(ctx),

    debug: (msg: string, meta?: LogMeta) => {
      if (!shouldLog('debug')) return
      output(baseEntry('debug', msg, meta))
    },
    info: (msg: string, meta?: LogMeta) => {
      if (!shouldLog('info')) return
      output(baseEntry('info', msg, meta))
    },
    warn: (msg: string, meta?: LogMeta) => {
      if (!shouldLog('warn')) return
      output(baseEntry('warn', msg, meta))
    },
    error: (msg: string, meta?: LogMeta) => {
      if (!shouldLog('error')) return
      output(baseEntry('error', msg, meta))
    },

    setLevel: (lvl: LogLevel) => { level = lvl },

    setHook: (h?: (entry: Record<string, unknown>) => void) => { hook = h },
  }
}

export const logger = createLogger({ service: 'ytplay-worker' })
export default logger
