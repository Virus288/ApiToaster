import FileController from './controller.js';
import Log from '../../tools/logger.js';
import { checkIfObject } from '../../utils/index.js';
import Proto from '../protobuf/index.js';
import type { ILog, ILogEntry, ILogProto, ILogs, ILogsProto, INotFormattedLogEntry } from '../../../types/index.js';

export default class FileReader {
  private _controller: FileController;
  _malformed: string[] = [];

  constructor() {
    this._controller = new FileController();
  }

  get malformed(): string[] {
    return this._malformed;
  }

  set malformed(value: string[]) {
    this._malformed = value;
  }

  private get controller(): FileController {
    return this._controller;
  }

  getMalformedLogs(): string[] {
    return this.malformed;
  }
  /**
   * Read logs files.
   * @description Get current or specified log file, read and return it for usage.
   * @param fileName Name of a file to be read.
   * @returns {ILogs} Saved logs.
   */
  init(fileName?: string): ILogsProto | ILogs {
    Log.debug('Log reader', 'Initing');
    this.preRead();

    const file = this.controller.fetchCurrentLogFile(fileName);

    // const logCount=this.
    return this.controller.prepareLogfile(file);
  }

  /**
   * Init basic files.
   * @description Initialize basic directories and files.
   * @returns {void} Void.
   */
  private preRead(): void {
    Log.debug('File reader', 'Pre');
    this.controller.initDirectories();
  }

  /**
   * Preload load.
   * @description Preload log file.
   * @param fileName Target file.
   * @returns {[string, INotFormattedLogEntry][]} Logs files.
   * @async
   */
  async preLoadLogs(fileName?: string): Promise<[string, INotFormattedLogEntry][]> {
    Log.debug('File reader', 'Preloading logs');

    const logs = this.init(fileName);
    return this.prepareLogs(logs.logs);
  }
  /**
   * Submit data for user.
   * @description Submit data for user.
   * @param logs Read logs from file.
   * @returns {[string, INotFormattedLogEntry][]} Prepared logs.
   * @async
   * @private
   */
  async prepareLogs(logs: ILogProto | ILog): Promise<[string, INotFormattedLogEntry][]> {
    Log.debug('File reader', 'Preparing logs');

    const removeEmptyFields = (log: INotFormattedLogEntry): Partial<INotFormattedLogEntry> => {
      return Object.entries(log).reduce((acc, [key, value]) => {
        // Always include 'body', even if it's empty
        if (key === 'body') {
          if (value !== null && typeof value === 'object') {
            acc[key] = value as Record<string, unknown>;
          }
          return acc;
        }
        // Type-specific checks for each key
        switch (key) {
          case 'queryParams':
          case 'headers':
            if (
              typeof value === 'object' &&
              value !== null &&
              Object.keys(value as Record<string, string>).length > 0
            ) {
              acc[key] = value as Record<string, string>;
            }
            break;
          case 'ip':
          case 'occured':
            if (typeof value === 'string' && value && value.trim() !== '') {
              acc[key] = value;
            }
            break;

          case 'statusCode':
            if (typeof value === 'number' && value) {
              acc[key] = value;
            }
            break;

          case 'method':
            if (typeof value === 'string' && value && value.trim() !== '') {
              acc[key] = value;
            }
            break;
          default:
            break;
        }
        return acc;
      }, {} as Partial<INotFormattedLogEntry>);
    };

    const proto = new Proto();
    // const malformed: string[] = [];
    const prepared = await Promise.all(
      Object.entries(logs).map(async ([k, v]) => {
        let decodedLog: ILogEntry | INotFormattedLogEntry;
        const isObject = checkIfObject(v as string);
        if (isObject) {
          decodedLog = JSON.parse(v as string) as ILogEntry;
        } else {
          decodedLog = await proto.decodeLogEntry(v as string);
        }
        try {
          // Dynamically construct the log entry
          const result: INotFormattedLogEntry = {
            body:
              typeof decodedLog.body === 'string'
                ? (JSON.parse(decodedLog.body) as Record<string, unknown>)
                : decodedLog.body,
            method: decodedLog.method,
            ip: decodedLog.ip,
            statusCode: decodedLog.statusCode,
            occured: decodedLog.occured,
          };

          // Conditionally include fields
          if (decodedLog.body) {
            result.body =
              typeof decodedLog.body === 'string'
                ? (JSON.parse(decodedLog.body) as Record<string, unknown>)
                : decodedLog.body;
          }
          if (decodedLog.queryParams) {
            result.queryParams =
              decodedLog.queryParams && typeof decodedLog.queryParams === 'string'
                ? (JSON.parse(decodedLog.queryParams) as Record<string, string>)
                : undefined;
          }
          if (decodedLog.headers) {
            result.headers =
              typeof decodedLog.headers === 'string'
                ? (JSON.parse(decodedLog.headers) as Record<string, string | string[]>)
                : decodedLog.headers;
          }

          const newResult = removeEmptyFields(result);
          return [k, newResult];
        } catch (_err) {
          if (
            decodedLog.body &&
            typeof decodedLog.body === 'object' &&
            !Array.isArray(decodedLog.body) &&
            decodedLog.body !== null &&
            Object.keys(decodedLog.body).length > 0
          ) {
            Log.debug('File reader', `Log ${k} seems to be an object type instead of JSON type`);
            return [k, v] as unknown as [string, INotFormattedLogEntry];
          }

          this.malformed.push(k);
          return null;
        }
      }),
    );
    const filteredPrepared = prepared.filter((e) => e);

    if (this.malformed.length > 0) {
      Log.error(
        'File reader',
        `Seems that logs ${this.malformed.join(', ')} were malformed. Currently this application cannot remove malformed logs. Please remove them manually, or via desktop app`,
      );
    }

    Log.debug('File reader', 'Formatted logs', JSON.stringify(filteredPrepared));

    return filteredPrepared as [string, INotFormattedLogEntry][];
  }
}
