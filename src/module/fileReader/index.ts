import { CannotCreateFile } from '../../errors/index.js';
import Log from '../../tools/logger.js';
import State from '../../tools/state.js';
import Proto from '../protobuf/index.js';
import TimeTravel from '../timeTravel/index.js';
import type { IIndex, ILog, ILogProto, ILogsProto, INotFormattedLogEntry } from '../../../types/index.js';
import type express from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export default class FileReader {
  private _logs: ILogsProto;
  private _index: IIndex;

  constructor() {
    this._logs = { logs: {} };
    this._index = { indexes: {} };
  }

  private get logs(): ILogsProto {
    return this._logs;
  }

  private set logs(value: ILogsProto) {
    this._logs = value;
  }

  private get index(): IIndex {
    return this._index;
  }

  private set index(value: IIndex) {
    this._index = value;
  }

  /**
   * Save new log.
   * @description Preapre and save new log.
   * @param req {express.Request} Request received from user.
   * @returns {void} Void.
   */
  async save(req: express.Request): Promise<void> {
    this.pre();

    this.prepareLogfile();
    this.prepraeIndexFile();

    await this.prepareLog(req);
    this.saveFiles();
  }

  /**
   * Read logs files.
   * @description Read log files and return them for usage.
   * @returns {ILogs} Saved logs.
   */
  read(): ILogsProto {
    this.pre();

    this.validateFile('index.json', JSON.stringify({ indexes: {} }));
    this.validateFile('logs.json', JSON.stringify({ logs: {} }));

    this.prepareLogfile();
    return this.logs;
  }

  /**
   * Init basic files.
   * @description Initialize basic directories and files.
   * @returns {ILogs} Saved logs.
   */
  private pre(): void {
    this.initDirectories();
    this.validateFile('index.json', JSON.stringify({ indexes: {} }));
    this.validateFile('logs.json', JSON.stringify({ logs: {} }));
  }

  /**
   * Initialize location.
   * @description  Initialize directories and files on given path.
   * @returns {void} Void.
   * @private
   */
  private initDirectories(): void {
    const dirPath = State.config.path;

    if (!fs.existsSync(dirPath)) {
      Log.debug('File reader', 'Path does not exist. Creating one');

      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        Log.error('File reader', 'Error while making logs directory', error);
      }
    }
  }

  /**
   * Prepare new log.
   * @description Preapre new log and index it.
   * @param req {express.Request} Request received from user.
   * @returns {void} Void.
   * @private
   */
  private async prepareLog(req: express.Request): Promise<void> {
    const uuid = randomUUID() as string;
    const proto = new Proto();

    const body: INotFormattedLogEntry = {
      method: State.config.method ? req.method : undefined,
      body: State.config.body ? ((req.body ?? {}) as Record<string, unknown>) : {},
      queryParams: State.config.queryParams ? (req.query as Record<string, string>) : {},
      headers: State.config.headers ? req.headers : {},
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

    this.logs.logs = { ...this.logs.logs, ...logProto };
    const time = new TimeTravel();
    await time.prepareLogs(this.logs.logs);
    this.index.indexes[uuid] = path.resolve(State.config.path, 'index.json');
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
    const logsLocation = path.resolve(State.config.path, 'logs.json');

    try {
      fs.writeFileSync(logsLocation, JSON.stringify(this.logs, null, 2));
      fs.writeFileSync(indexLocation, JSON.stringify(this.index, null, 2));
    } catch (error) {
      Log.error('Save File', error);
    }
  }

  /**
   * Preapre index files.
   * @description Read, validate and prepare index files.
   * @returns {void} Void.
   * @private
   */
  private prepraeIndexFile(): void {
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
   * Preapre log files.
   * @description Read, validate and prepare log files.
   * @returns {void} Void.
   * @private
   */
  private prepareLogfile(): void {
    try {
      const location = path.resolve(State.config.path, 'logs.json');
      const data = fs.readFileSync(location).toString();
      const file = JSON.parse(data) as ILogsProto;

      if (file?.logs) {
        this.logs = file;
      } else {
        Log.warn('File reader', 'Log file seems to be malformatted. Will replace it on next save');
        this.logs = file ?? { logs: {} };
      }
    } catch (error) {
      Log.warn('File reader', 'Got error while parsing data', (error as Error).message);
      this.logs = { logs: {} };
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
}
