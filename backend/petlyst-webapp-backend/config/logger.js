/**
 * Pino logger setup for the backend.
 *
 * - Production / CI: JSON output (default pino transport) so the lines
 *   are parseable by log shippers (Datadog, Loki, CloudWatch, etc).
 * - Local dev (NODE_ENV !== 'production'): human-readable output via
 *   `pino-pretty` (a devDependency only). Requires `npm install`.
 *
 * Level controlled by `LOG_LEVEL` env var; defaults to `info` outside
 * dev (where it's `debug`).
 */

const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const logger = pino({
  level,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
});

module.exports = logger;
