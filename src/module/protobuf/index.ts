import protobuf from 'protobufjs';
import Log from '../../tools/logger.js';
import type { ILogEntry } from '../../../types';
import path from 'path';
import { fileURLToPath } from 'url';

export default class Proto {
  private _modulePath: string;

  constructor() {
    this._modulePath = path.dirname(fileURLToPath(import.meta.url));
  }

  public get modulePath(): string {
    return this._modulePath;
  }

  public set modulePath(value: string) {
    this._modulePath = value;
  }

  /**
   * Load protobuf file.
   * @description It sets protobuf root from file.
   * @returns {protobuf.Root} Reference to protobuf file root.
   */
  async loadProto(): Promise<protobuf.Root> {
    return protobuf.load(path.resolve(this.modulePath, '..', '..', '..', 'protos/log.proto'));
  }

  /**
   * Encoding single log.
   * @description Encoding single log to base64 string.
   * @param logEntry Single string version of log entry.
   * @returns {string} String representation of buffer.
   */
  async encodeLog(logEntry: ILogEntry): Promise<string> {
    const root = await this.loadProto();

    const LogEntry = root.lookupType('apitoaster.LogEntry');

    const defaultLog: ILogEntry = {
      method: '',
      body: '',
      queryParams: '',
      headers: '',
      ip: '',
      occured: '',
    };

    const log = { ...defaultLog, ...logEntry };

    const error = LogEntry.verify(log);
    if (error) {
      Log.error('Protobuf', `Error verifying log entry: ${error}`);
    }

    const encodedLog = LogEntry.encode(LogEntry.create(log)).finish();

    return Buffer.from(encodedLog).toString('base64');
  }

  /**
   * Decoding single log.
   * @description Decoding single log from base64 string to log entry.
   * @param logEntry Single value of Buffer as a base64 string from log file.
   * @returns {ILogEntry} String version of log entry.
   */
  async decodeLogEntry(logEntry: string): Promise<ILogEntry> {
    const root = await this.loadProto();

    const LogEntry = root.lookupType('apitoaster.LogEntry');

    const buf = Buffer.from(logEntry, 'base64');
    const decoded = LogEntry.decode(buf) as unknown as ILogEntry;

    const error = LogEntry.verify(decoded);
    if (error) {
      Log.error('Protobuf', `Error verifying log entry: ${error}`);
    }
    return decoded;
  }
}
