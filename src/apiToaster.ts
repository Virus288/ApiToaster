import FileReader from './module/fileReader.js';
import defaultConfig from './tools/config.js';
import Log from './tools/logger.js';
import State from './tools/state.js';
import type { IConfig } from '../types';
import type express from 'express';
import path from 'path';

class Toaster {
  private _fileReader: FileReader;
  constructor() {
    this._fileReader = new FileReader();
  }

  public get fileReader(): FileReader {
    return this._fileReader;
  }

  public set fileReader(value: FileReader) {
    this._fileReader = value;
  }

  async init(req: express.Request, config?: IConfig): Promise<void> {
    return new Promise((resolve) => {
      this.initPath(config);
      this.save(req);
      resolve();
    });
  }

  private initPath(config?: IConfig): void {
    if (config?.path) {
      const root = process.cwd();
      const str = config.path.startsWith('/') ? config.path.slice(1) : config.path;
      const dirPath = path.resolve(root, str);
      State.state = { ...defaultConfig(), ...config, path: dirPath };
    } else {
      State.state = defaultConfig();
    }
  }

  private save(req: express.Request): void {
    this.fileReader.save(req);
  }
}

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
  new Toaster().init(req, config).catch((err) => {
    Log.error('Main action', 'Got error', (err as Error).message);
  });
  next();
}
