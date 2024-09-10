import Log from '../tools/logger.js';
import State from '../tools/state.js';
import type { IIndex, IIndexEntry, ILog, ILogEntry, ILogs } from '../../types';
import type express from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export default class FileReader {
  private _logs: ILogs;
  private _index: IIndex;
  private _logPath?: string;
  private _indexPath?: string;
  constructor() {
    this._logs = { logs: {} };
    this._index = { indexes: {} };
  }

  public get logs(): ILogs {
    return this._logs;
  }

  public set logs(value: ILogs) {
    this._logs = value;
  }

  public get index(): IIndex {
    return this._index;
  }

  public set index(value: IIndex) {
    this._index = value;
  }
  public get logPath(): string {
    this._logPath = path.resolve(State.state.path as string, 'logs.json');
    return this._logPath;
  }

  public set logPath(value: string) {
    this._logPath = value;
  }

  public get indexPath(): string {
    this._indexPath = path.resolve(State.state.path as string, 'index.json');
    return this._indexPath;
  }

  public set indexPath(value: string | undefined) {
    this._indexPath = value;
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
  }
  /**
   *  Method to create log file.
   * @param name Filename.
   */
  private createLogFile(name: string): void {
    const logPath = path.resolve(State.state.path as string, name);
    if (!fs.existsSync(logPath)) {
      try {
        const fd = fs.openSync(logPath, 'wx+');
        const content = JSON.stringify({ logs: {} });
        const buffer = Buffer.from(content);
        fs.writeSync(fd, buffer);
        fs.closeSync(fd);
      } catch (error) {
        Log.error('FileReader', 'Writing File', error);
      }
    }
    this.logPath = logPath; // Update logPath to the new file
  }
  /**
   *  Method to create index file.
   */
  private createIndexFile(): void {
    if (!this.indexPath) return;
    if (!fs.existsSync(this.indexPath)) {
      try {
        const fd = fs.openSync(this.indexPath, 'wx+');
        const content = JSON.stringify({ indexes: {} });
        const buffer = Buffer.from(content);
        fs.writeSync(fd, buffer);
        fs.closeSync(fd);
      } catch (error) {
        Log.error('Initialize index file', 'Writing File', error);
      }
    }
  }
  /**
   *  Method to read index file, and update it fields.
   * @param key Key that matches individual log key.
   * @param fileName Name of the log file that key matches.
   */
  private readIndex(key: string, fileName: string): void {
    const indexEntry: IIndexEntry = {
      [key]: fileName,
    };

    try {
      const data = fs.readFileSync(this.indexPath).toString();
      this.index = JSON.parse(data) as IIndex;
    } catch (error) {
      Log.error('Parse data', error);
    }
    Object.assign(this.index.indexes, indexEntry);
  }
  /**
   *  Method to obfuscate provided in config fields.
   * @param log Single log.
   */
  private obfuscate(log: ILog): void {
    Object.keys(log).forEach((uuid) => {
      State.state.obfuscate?.forEach((field) => {
        const logEntry = log[uuid];
        if (logEntry && field in logEntry) {
          logEntry[field as keyof ILogEntry] = '***';
        }
      });
    });
  }
  /**
   *  Function to read and update logs.
   * @param req Express request.
   */
  private readLogfile(req: express.Request): void {
    const tempFileName = 'logs.json';
    const uuid = randomUUID();
    this.createLogFile(tempFileName);

    const log: ILog = {
      [uuid]: {
        method: State.state.method ? req.method : undefined,
        body: State.state.body ? (req.body as Record<string, unknown>) : undefined,
        queryParams: State.state.queryParams ? req.query : undefined,
        headers: State.state.headers ? req.headers : undefined,
        ip: State.state.ip ? req.ip : undefined,
      },
    };

    this.readIndex(uuid, tempFileName);
    this.obfuscate(log);

    try {
      const data = fs.readFileSync(this.logPath).toString();
      this.logs = JSON.parse(data) as ILogs;
    } catch (error) {
      Log.error('Parse data', error);
    }
    Object.assign(this._logs.logs, log);
  }

  /**
   *  Function to save logs and index to a file.
   */
  private saveFiles(): void {
    try {
      fs.writeFileSync(this.logPath, JSON.stringify(this.logs, null, 2));
      fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
    } catch (error) {
      Log.error('Save File', error);
    }
  }

  save(req: express.Request): void {
    this.initDirectories();
    this.createIndexFile();
    this.readLogfile(req);
    this.saveFiles();
  }
}
