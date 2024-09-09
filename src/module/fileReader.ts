import Log from '../tools/logger.js';
import State from '../tools/state.js';
import type { ILog } from '../../types';
import type express from 'express';
import fs from 'fs';
import path from 'path';

export default class FileReader {
  private _logs: ILog[];
  private _logPath: string;
  constructor() {
    this._logs = [];
    this._logPath = '';
  }

  public get logs(): ILog[] {
    return this._logs;
  }

  public set logs(value: ILog[]) {
    this._logs = value;
  }

  public get logPath(): string {
    return this._logPath;
  }

  public set logPath(value: string) {
    this._logPath = value;
  }
  /**
   *  Function to initialize directories and files
   *  on given path.
   * @returns Path to log file.
   */
  private initDirectories(): void {
    if (!State.state.path) {
      Log.error('Log', 'No path provided');
      return;
    }
    const dirPath = State.state.path;
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        Log.error('Initialize directories', 'Make Directory', error);
      }
    }

    this.logPath = path.resolve(dirPath, 'logs.json');
    if (!fs.existsSync(this.logPath)) {
      try {
        fs.writeFileSync(this.logPath, JSON.stringify([]));
      } catch (error) {
        Log.error('Initialize directories', 'Writing File', error);
      }
    }
  }
  /**
   *  Method to obfuscate provided in config fields.
   * @param log Single log.
   */
  private obfuscate(log: ILog): void {
    State.state.obfuscate?.forEach((field) => {
      if (field in log.value) {
        log.value[field as keyof ILog['value']] = '***';
      }
    });
  }
  /**
   *  Function to save a log into a file.
   * @param req Express request.
   */
  readfile(req: express.Request): void {
    this.initDirectories();
    if (this.logPath.length === 0) {
      return;
    }
    const fileSize = fs.statSync(this.logPath).size;
    if (fileSize === 0) {
      fs.writeFileSync(this.logPath, JSON.stringify([]));
    }
    const newLog: ILog = {
      key: 'randomString',
      value: {
        method: State.state.method ? req.method : undefined,
        body: State.state.body ? (req.body as Record<string, unknown>) : undefined,
        queryParams: State.state.queryParams ? req.query : undefined,
        headers: State.state.headers ? req.headers : undefined,
        ip: State.state.ip ? req.ip : undefined,
      },
    };

    this.obfuscate(newLog);

    try {
      const data = fs.readFileSync(this.logPath).toString();
      this.logs = JSON.parse(data) as ILog[];
    } catch (error) {
      Log.error('Parse data', error);
    }
    this.logs.push(newLog);
  }

  saveFile(): void {
    try {
      fs.writeFileSync(this.logPath, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      Log.error('Save File', error);
    }
  }
}
