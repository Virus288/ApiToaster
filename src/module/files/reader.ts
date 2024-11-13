import FileController from './controller.js';
import Log from '../../tools/logger.js';
import { checkIfObject } from '../../utils/index.js';
import Proto from '../protobuf/index.js';
import type { ILog, ILogEntry, ILogProto, ILogs, ILogsProto, INotFormattedLogEntry } from '../../../types/index.js';

export default class FileReader {
  private _controller: FileController;

  constructor() {
    this._controller = new FileController();
  }

  private get controller(): FileController {
    return this._controller;
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

    return this.controller.prepareLogfile(file, true);
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
    Log.debug('Time travel', 'Preloading logs');

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
    Log.debug('Time travel', 'Preparing logs');

    const proto = new Proto();
    const malformed: string[] = [];
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
          return [
            k,
            {
              ...decodedLog,
              body:
                typeof decodedLog.body === 'string'
                  ? (JSON.parse(decodedLog.body) as Record<string, unknown>)
                  : decodedLog.body,
              occured: new Date(decodedLog.occured).getTime(),
              queryParams:
                decodedLog.queryParams && typeof decodedLog.queryParams === 'string'
                  ? (JSON.parse(decodedLog.queryParams) as Record<string, unknown>)
                  : (decodedLog.queryParams ?? {}),
              headers:
                decodedLog.headers && typeof decodedLog.headers === 'string'
                  ? (JSON.parse(decodedLog.headers) as Record<string, unknown>)
                  : (decodedLog.headers ?? {}),
            } as INotFormattedLogEntry,
          ];
        } catch (_err) {
          if (
            decodedLog.body &&
            typeof decodedLog.body === 'object' &&
            !Array.isArray(decodedLog.body) &&
            decodedLog.body !== null &&
            Object.keys(decodedLog.body).length > 0
          ) {
            Log.debug('Time travel', `Log ${k} seems to be an object type instead of JSON type`);
            return [k, v] as unknown as [string, INotFormattedLogEntry];
          }

          malformed.push(k);
          return null;
        }
      }),
    );
    const filteredPrepared = prepared.filter((e) => e);

    if (malformed.length > 0) {
      Log.error(
        'Time travel',
        `Seems that logs ${malformed.join(', ')} were malformed. Currently this application cannot remove malformed logs. Please remove them manually, or via desktop app`,
      );
    }

    Log.debug('Time travel', 'Formatted logs', JSON.stringify(filteredPrepared));

    return filteredPrepared as [string, INotFormattedLogEntry][];
  }
}
