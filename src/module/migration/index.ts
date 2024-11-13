import Log from '../../tools/logger.js';
import { checkIfObject } from '../../utils/index.js';
import FileReader from '../files/reader.js';
import FileWriter from '../files/writer.js';
import Proto from '../protobuf/index.js';
import type { ILogProto, ILog, INotFormattedLogEntry, ILogEntry, ILogsProto, ILogs } from '../../../types/index.js';

export default class Migration {
  private _fileReader: FileReader;
  private _fileWriter: FileWriter;

  constructor() {
    this._fileReader = new FileReader();
    this._fileWriter = new FileWriter();
  }

  private get fileReader(): FileReader {
    return this._fileReader;
  }

  private get fileWriter(): FileWriter {
    return this._fileWriter;
  }

  /**
   * Migrate file.
   * @description Migrate targeted file to target format.
   * @param fileName Target file.
   * @param logFormat Target format.
   * @returns {void} Void.
   * @async
   */
  async init(fileName?: string, logFormat?: string): Promise<void> {
    Log.debug('Time travel', 'Migrating');

    const logs = this.readLogs(fileName);
    const prepared = await this.migrateLogs(logs.logs, logFormat!);
    const tobesaved = { logs: prepared };
    this.fileWriter.save(`migrate_${fileName}`, tobesaved);
  }

  private readLogs(fileName?: string): ILogsProto | ILogs {
    return this.fileReader.init(fileName);
  }

  private async migrateLogs(logs: ILogProto | ILog, logFormat: string): Promise<ILogProto | ILog> {
    const proto = new Proto();

    const migratedLogs = await Promise.all(
      Object.entries(logs).map(async ([k, v]) => {
        let decodedLog: string | INotFormattedLogEntry;
        const isObject = checkIfObject(v as string);
        let buffed: ILogEntry;
        if (logFormat === 'p') {
          if (isObject) {
            buffed = this.fileWriter.prepareBuffedLog(JSON.parse(v as string) as INotFormattedLogEntry);
          } else {
            buffed = v as ILogEntry;
          }
          decodedLog = isObject ? await proto.encodeLog(buffed) : (v as string);
        } else if (logFormat === 'j') {
          decodedLog = isObject
            ? (v as INotFormattedLogEntry)
            : this.convertLog(await proto.decodeLogEntry(v as string));
        } else {
          return null;
        }

        try {
          return { [k]: decodedLog }; // Return as a key-value pair object
        } catch (_err) {
          Log.error('Migrate', 'Error migrating', _err);
          return null;
        }
      }),
    );

    const filteredMigratedLogs = migratedLogs.filter((e) => e);

    return Object.assign({}, ...filteredMigratedLogs) as ILogProto | ILog;
  }
  private convertLog(log: ILogEntry): INotFormattedLogEntry {
    const l = {
      method: log.method ?? '',
      body: typeof log.body === 'string' ? (JSON.parse(log.body) as Record<string, unknown>) : log.body,
      queryParams:
        log.queryParams && typeof log.queryParams === 'string'
          ? (JSON.parse(log.queryParams) as Record<string, unknown>)
          : (log.queryParams ?? {}),
      headers:
        log.headers && typeof log.headers === 'string'
          ? (JSON.parse(log.headers) as Record<string, unknown>)
          : (log.headers ?? {}),
      occured: new Date(log.occured).getTime(),
      ip: log.ip ?? '0.0.0.0',
    } as INotFormattedLogEntry;
    return l;
  }
}
