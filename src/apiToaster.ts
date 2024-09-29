import FileWriter from './module/files/writer.js';
import defaultConfig from './tools/config.js';
import Log from './tools/logger.js';
import State from './tools/state.js';
import type { IToasterConfig } from '../types';
import type express from 'express';
import path from 'path';

class Toaster {
  private _fileWriter: FileWriter;

  constructor() {
    this._fileWriter = new FileWriter();
  }

  public get fileWriter(): FileWriter {
    return this._fileWriter;
  }

  public set fileWriter(value: FileWriter) {
    this._fileWriter = value;
  }

  /**
   * Initialize application.
   * @description Initialize application to save logs.
   * @param req {express.Request} Request received from user.
   * @param config {IToasterConfig} Application config.
   * @returns {void} Void.
   * @async
   */
  async init(req: express.Request, config?: IToasterConfig): Promise<void> {
    Log.log('Main action', 'Initing');

    this.initPath(config);

    const shouldSave = this.shouldSave(req);

    if (shouldSave) {
      await this.fileWriter.init(req);
    }
  }
  /**
   * Initialize path.
   * @description Prepare application and initialize its path.
   * @param config {IToasterConfig} Toaster's config.
   * @returns {void} Void.
   * @private
   */
  private initPath(config?: IToasterConfig): void {
    if (
      config &&
      typeof config === 'object' &&
      !Array.isArray(config) &&
      config !== null &&
      Object.keys(config).length > 0
    ) {
      Log.log('Main action', 'User provided config');
      if (config.path) {
        const root = process.cwd();
        const str = config.path.startsWith('/') ? config.path.slice(1) : config.path;
        const dirPath = path.resolve(root, str);
        State.config = { ...defaultConfig(), ...config, path: dirPath };
      } else {
        State.config = { ...defaultConfig(), ...config };
      }
    } else {
      Log.log('Main action', 'User did not provide config');

      State.config = defaultConfig();
    }
  }

  private shouldSave(req: express.Request): boolean {
    return req.headers?.['x-toaster'] === undefined;
  }
}

/**
 * Main function to handle logging.
 * @description Default function used to handle req logging and much more.
 * @param req Express request.
 * @param _res Express response.
 * @param next Express next.
 * @param config Config used for logging middleware.
 * @default
 */
export default function (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
  config?: IToasterConfig,
): void {
  new Toaster().init(req, config).catch((err) => {
    Log.error('Main action', 'Got error', (err as Error).message);
  });
  next();
}
