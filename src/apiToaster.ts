// import defaultConfig from './tools/config.js';
import initPath from './tools/initPath.js';
import saveFile from './tools/saveFile.js';
// import State from './tools/state.js';
import type { IConfig } from '../types';
import type express from 'express';

/**
 * Main function to handle logging.
 * @description Default function used to handle req logging and much more.
 * @param req Express request.
 * @param _res Express response.
 * @param next Express next.
 * @param config Config used for logging middleware.
 */
export default function (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
  config?: IConfig,
): void {
  initPath(config);
  saveFile(req);
  next();
}
