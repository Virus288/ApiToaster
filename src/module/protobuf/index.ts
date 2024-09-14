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

  async loadProto(): Promise<protobuf.Root> {
    return protobuf.load(path.resolve(this.modulePath, '..', '..', '..', 'protos/log.proto'));
  }

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

  async decodeLogEntry(logEntry: string): Promise<ILogEntry> {
    const root = await this.loadProto();

    const LogEntry = root.lookupType('apitoaster.LogEntry');

    const buf = Buffer.from(logEntry,'base64');
    const decoded = LogEntry.decode(buf) as unknown as ILogEntry;

    const error = LogEntry.verify(decoded);
    if (error) {
      Log.error('Protobuf', `Error verifying log entry: ${error}`);
    }
    return decoded;
  }
}
