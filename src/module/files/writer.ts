import FileController from './controller.js';
import { CannotCreateFile } from '../../errors/index.js';
import Log from '../../tools/logger.js';
import State from '../../tools/state.js';
import Proto from '../protobuf/index.js';
import type {
  IConfigLog,
  IIndex,
  ILog,
  ILogProto,
  ILogs,
  ILogsProto,
  INotFormattedLogEntry,
} from '../../../types/index.js';
import type express from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export default class FileWriter {
  private _controller: FileController;
  private _logs: ILogsProto;
  private _logsJson: ILogs;
  private _index: IIndex;
  private _config: IConfigLog;
  private _currLogSize: number = 0;
  private _currLogFile: string = 'logs_0.json';

  constructor() {
    this._controller = new FileController();
    this._logs = { logs: {} };
    this._logsJson = { logs: {} };
    this._index = { indexes: {} };
    this._config = { disableProto: false };
  }

  private get logs(): ILogsProto {
    return this._logs;
  }

  private set logs(val: ILogsProto) {
    this._logs = val;
  }

  public get logsJson(): ILogs {
    return this._logsJson;
  }

  public set logsJson(value: ILogs) {
    this._logsJson = value;
  }
  private get index(): IIndex {
    return this._index;
  }

  private set index(val: IIndex) {
    this._index = val;
  }
  public get config(): IConfigLog {
    return this._config;
  }

  public set config(value: IConfigLog) {
    this._config = value;
  }

  private get currLogSize(): number {
    return this._currLogSize;
  }

  private set currLogSize(val: number) {
    this._currLogSize = val;
  }

  private get currLogFile(): string {
    return this._currLogFile;
  }

  private set currLogFile(val: string) {
    this._currLogFile = val;
  }

  private get controller(): FileController {
    return this._controller;
  }

  /**
   * Save new log.
   * @description Prepare and save new log.
   * @param req {express.Request} Request received from user.
   * @returns {void} Void.
   */
  async init(req: express.Request): Promise<void> {
    this.pre();
    this.currLogFile = this.controller.fetchCurrentLogFile();
    if (this.config.disableProto) {
      this.logs = this.controller.prepareLogfile(this.currLogFile);
    } else {
      this.logsJson = this.controller.prepareLogJsonFile(this.currLogFile);
    }
    this.prepareIndexFile();
    this.prepareConfigFile();

    if (this.config.disableProto) {
      this.prepareJsonLog(req);
    } else {
      await this.prepareLog(req);
    }
    this.prepareConfig();
    this.checkFileSize(this.currLogFile);
    this.saveFiles();
  }

  /**
   * Init basic files.
   * @description Initialize basic directories and files.
   * @returns {void} Void.
   */
  private pre(): void {
    this.controller.initDirectories();
    this.validateFile('index.json', JSON.stringify({ indexes: {} }));
    this.validateFile(this.currLogFile, JSON.stringify({ logs: {} }));
  }

  /**
   * Prepare new log.
   * @description Prepare new log and index it.
   * @param req {express.Request} Request received from user.
   * @returns {void} Void.
   * @private
   */
  private async prepareLog(req: express.Request): Promise<void> {
    const uuid = randomUUID() as string;
    const proto = new Proto();

    const filteredHeaders = { ...req.headers };

    // Ignore content header instead of replacing
    delete filteredHeaders['content-length'];

    const body: INotFormattedLogEntry = {
      method: State.config.method ? req.method : undefined,
      body: State.config.body ? ((req.body ?? {}) as Record<string, unknown>) : {},
      queryParams: State.config.queryParams ? (req.query as Record<string, string>) : {},
      headers: State.config.headers ? filteredHeaders : {},
      ip: State.config.ip ? req.ip : undefined,
      occured: Date.now(),
    };
    this.obfuscate(body);

    const logBody: ILog['body'] = {
      ...body,
      body: JSON.stringify(body.body),
      occured: new Date(body.occured).toISOString(),
      queryParams: JSON.stringify(body.queryParams),
      headers: JSON.stringify(body.headers),
    };
    const logProto: ILogProto = {
      [uuid]: await proto.encodeLog(logBody),
    };

    this.currLogSize = Buffer.byteLength(JSON.stringify(logProto));
    this.logs.logs = { ...this.logs.logs, ...logProto };
    this.index.indexes[uuid] = path.resolve(State.config.path, 'index.json');
  }

  /**
   * Prepare new log json.
   * @description Preapre new json log and index it.
   * @param req {express.Request} Request received from user.
   * @returns {void} Void.
   * @private
   */
  private prepareJsonLog(req: express.Request): void {
    const uuid = randomUUID() as string;

    const filteredHeaders = { ...req.headers };

    delete filteredHeaders['content-length'];

    const body: INotFormattedLogEntry = {
      method: State.config.method ? req.method : undefined,
      body: State.config.body ? ((req.body ?? {}) as Record<string, unknown>) : {},
      queryParams: State.config.queryParams ? (req.query as Record<string, string>) : {},
      headers: State.config.headers ? filteredHeaders : {},
      ip: State.config.ip ? req.ip : undefined,
      occured: Date.now(),
    };
    this.obfuscate(body);

    const logBody: ILog['body'] = {
      ...body,
      body: JSON.stringify(body.body),
      occured: new Date(body.occured).toISOString(),
      queryParams: JSON.stringify(body.queryParams),
      headers: JSON.stringify(body.headers),
    };
    const logProto: ILog = {
      [uuid]: logBody,
    };

    this.currLogSize = Buffer.byteLength(JSON.stringify(logProto));
    this.logsJson.logs = { ...this.logsJson.logs, ...logProto };
    this.index.indexes[uuid] = path.resolve(State.config.path, 'index.json');
  }

  private prepareConfig(): void {
    this.config.disableProto = State.config.disableProto;
  }
  /**
   * Validate and create files.
   * @description Validate and create files with base validates if they do not exist.
   * @param target File to validate.
   * @param baseBody File's body to initialize.
   * @returns {void} Void.
   * @throws {CannotCreateFile} Error whenever file cannot be created.
   * @private
   */
  private validateFile(target: string, baseBody: string): void {
    const location = path.resolve(State.config.path, target);

    try {
      if (!fs.existsSync(location)) {
        fs.writeFileSync(location, baseBody);
      }
    } catch (err) {
      Log.error('File reader', `Cannot create ${target} file`, (err as Error).message);
      throw new CannotCreateFile(target);
    }
  }

  /**
   * Save data.
   * @description Save prepared data to files.
   * @returns {void} Void.
   * @private
   */
  private saveFiles(): void {
    const indexLocation = path.resolve(State.config.path, 'index.json');
    const logsLocation = path.resolve(State.config.path, this.currLogFile);

    try {
      fs.writeFileSync(logsLocation, JSON.stringify(this.logs, null, 2));
      fs.writeFileSync(indexLocation, JSON.stringify(this.index, null, 2));
    } catch (error) {
      Log.error('Save File', error);
    }
  }

  /**
   * Prepare index files.
   * @description Read, validate and prepare index files.
   * @returns {void} Void.
   * @private
   */
  private prepareIndexFile(): void {
    const location = path.resolve(State.config.path, 'index.json');

    try {
      const data = fs.readFileSync(location).toString();
      this.index = JSON.parse(data) as IIndex;
    } catch (error) {
      Log.error('File reader', 'Got error while parsing indexes', (error as Error).message);
      this.index = { indexes: {} };
    }
  }
  /**
   * Preapre config file.
   * @description Read, validate and prepare config file.
   * @returns {void} Void.
   * @private
   */
  private prepareConfigFile(): void {
    const location = path.resolve(State.config.path, 'config.json');

    try {
      const data = fs.readFileSync(location).toString();
      this.config = JSON.parse(data) as IConfigLog;
    } catch (error) {
      Log.error('File reader', 'Got error while parsing config', (error as Error).message);
      this.config = { disableProto: false };
    }
  }

  /**
   * Obfuscate parameters from requests.
   * @description Method to obfuscate provided in config fields.
   * @param log Single log.
   * @returns {void} Void.
   * @private
   */
  private obfuscate(log: INotFormattedLogEntry): void {
    State.config.obfuscate
      .filter((field) => field !== 'occured')
      .forEach((e) => {
        if (log.body[e]) log.body[e] = '***';
      });
  }

  /**
   * Check for a file size.
   * @description Method to check for combined current file and element to be saved size.
   * @param logName Log file path name.
   * @returns {void} Void.
   * @private
   */
  private checkFileSize(logName: string): void {
    const logPath = path.resolve(State.config.path, logName);
    const size = fs.statSync(logPath).size + this.currLogSize;
    if (size > 50000000000) {
      this.incrementLogFile(logName);
      this.cleanLogs();
    }
  }

  /**
   * Clean logs object.
   * @description Method to clean previous logs and keep last one.
   * @returns {void} Void.
   * @private
   */
  private cleanLogs(): void {
    const lastLog = Object.entries(this.logs.logs).slice(-1);
    this.logs.logs = { ...Object.fromEntries(lastLog) };
  }

  /**
   * Increments log numeration.
   * @description Method to increment log file numeration.
   * @param logName Log file path name.
   * @returns {void} Void.
   * @private
   */
  private incrementLogFile(logName: string): void {
    const match = logName.match(/(\d+)/u);

    if (!match || match.length === 0) {
      Log.error('FileReader', 'Malformed file name.');
    }

    const number = parseInt(match![0], 10) + 1;
    this.currLogFile = logName.replace(/\d+/u, number.toString());
  }
}
