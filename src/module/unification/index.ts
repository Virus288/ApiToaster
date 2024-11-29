import Log from '../../tools/logger.js';
import { checkIfObject } from '../../utils/index.js';
import FileController from '../files/controller.js';
import FileReader from '../files/reader.js';
import FileWriter from '../files/writer.js';
import Proto from '../protobuf/index.js';
import type { ILogEntry, ILogs, ILogsProto } from '../../../types/index.js';

export default class Unification {
  private readonly _fileReader: FileReader;
  private readonly _fileWriter: FileWriter;
  private readonly _fileController: FileController;
  private _logs: ILogsProto | ILogs = { logs: {} };
  private _proto: Proto;

  constructor() {
    this._fileReader = new FileReader();
    this._fileController = new FileController();
    this._fileWriter = new FileWriter();
    this._proto = new Proto();
  }

  private get logs(): ILogsProto | ILogs {
    return this._logs;
  }

  private set logs(logs: ILogsProto | ILogs) {
    this._logs = logs;
  }

  private get fileController(): FileController {
    return this._fileController;
  }

  private get fileReader(): FileReader {
    return this._fileReader;
  }

  private get fileWriter(): FileWriter {
    return this._fileWriter;
  }

  private get proto(): Proto {
    return this._proto;
  }

  /**
   * Unificate file.
   * @description Unificate logs and add empty fields if missing in original file.
   * @param fileName Name of a file.
   * @returns {void} Void.
   * @async
   */
  async init(fileName?: string): Promise<void> {
    Log.debug('Data Migration', 'Migrating');

    this.readLogs(fileName);

    await this.generateDefaults();
    const file = this.fileController.fetchCurrentLogFile(fileName);
    this.fileWriter.save(file, this.logs);
  }
  /**
   * Read logs from file.
   * @param fileName Name of a file.
   * @returns { void } Void.
   */
  private readLogs(fileName?: string): void {
    this.logs = this.fileReader.init(fileName);
  }

  /**
   * Applies default values to all logs.
   * @returns {Promise<void>} Resolves when defaults are applied.
   * @async
   */
  private async generateDefaults(): Promise<void> {
    if ('logs' in this.logs && typeof this.logs.logs === 'object') {
      const logEntries = Object.entries(this.logs.logs);

      const updatedLogs: [string, string][] = await Promise.all(
        logEntries.map(async ([key, value]) => {
          let entry: ILogEntry;

          if (checkIfObject(value as string)) {
            // Handle JSON object logs
            entry = JSON.parse(value as string) as ILogEntry;
            entry = this.applyDefaults(entry); // Apply defaults
            return [key, JSON.stringify(entry)];
          }
          // Handle Protobuf logs
          const decodedEntry = await this.proto.decodeLogEntry(value as string);
          const updatedEntry = this.applyDefaults(decodedEntry);
          const reEncodedEntry = await this.proto.encodeLog(updatedEntry);
          return [key, reEncodedEntry];
        }),
      );

      for (const [key, value] of updatedLogs) {
        this.logs.logs[key as keyof typeof this.logs.logs] = value;
      }
    }
  }
  /**
   * Applies default values to a log entry.
   * @param entry The log entry to modify.
   * @returns {ILogEntry} The modified log entry with defaults applied.
   */
  private applyDefaults(entry: ILogEntry): ILogEntry {
    return {
      method: entry.method ? entry.method.trim() : 'GET',
      body: entry.body ?? '{}',
      queryParams: entry.queryParams ?? '{}',
      headers: entry.headers ?? '{}',
      ip: entry.ip && entry.ip.length > 0 ? entry.ip : '::ffff:127.0.0.1',
      statusCode: entry.statusCode ? entry.statusCode : 200,
      occured: entry.occured ?? new Date().toISOString(),
    };
  }
}
