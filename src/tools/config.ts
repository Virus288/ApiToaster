import type { IConfig, IToasterTimeTravel } from '../../types/index.js';
import path from 'path';

/**
 * Function to get default config .
 * @returns Configuration for a logging middleware.
 * @default
 */
export function defaultMiddlewareConfig(): IConfig {
  return {
    path: path.resolve(process.cwd(), 'Toaster'),
    shouldThrow: false,
    method: true,
    body: true,
    queryParams: true,
    headers: true,
    ip: false,
    obfuscate: ['password'],
    disableProto: false,
    statusCode: true,
  };
}

/**
 * Function to get default toaster config .
 * @returns Configuration for whole package.
 * @default
 */
export function defaultToasterConfig(): IToasterTimeTravel {
  return {
    waitUntillNextReq: 1000,
    inputBeforeNextReq: false,
    port: 5003,
    removeMalformed: false,
    countTime: false,
    logFileSize: 1000,
  };
}
