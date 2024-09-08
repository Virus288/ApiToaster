import defaultConfig from './tools/config.js';
import State from './tools/state.js';
import type { IConfig } from '../types';
import type express from 'express';

/**
 * Main function to handle logging.
 * @description Default function used to handle req logging and much more.
 * @param _req Express request.
 * @param _res Express response.
 * @param next Express next.
 * @param config Config used for logging middleware.
 */
export default function(
  _req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
  config?: IConfig,
): void {
  State.state = { ...defaultConfig(), ...config };
  next();
}
