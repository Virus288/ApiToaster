import protobuf from 'protobufjs';
import Log from '../../tools/logger.js';
import type { ILogEntry } from '../../../types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default class Proto {
  // private _modulePath: string;

  // constructor() {
    // this._modulePath = path.dirname(fileURLToPath(import.meta.url));
  // }

  // public get modulePath(): string {
  //   return this._modulePath;
  // }
  //
  // public set modulePath(value: string) {
  //   this._modulePath = value;
  // }

  /**
   * Get path to protobuf files.
   * @description It gets correct path to proto files for esm or commonjs.
   * @returns {string|undefined} Path to protobuf file.
   */

  private getModulePath(): string | undefined {
    const pathJson = path.resolve(process.cwd(), 'package.json');
    let mPath: string;
    try {
      const packageData = fs.readFileSync(pathJson, 'utf8');
      const packageJson = JSON.parse(packageData) as Record<string, string>;
      if (packageJson.type === 'module') {
        const modulePath = path.dirname(fileURLToPath(import.meta.url));
        mPath = path.resolve(modulePath, '..', '..', '..', 'protos/log.proto');
      } else {
        mPath = path.resolve(process.cwd(), 'node_modules', 'api-toaster', 'protos/log.proto');
      }
      return mPath;
    } catch (error) {
      Log.error('FileReader', 'Error getting module path:', error);
      return undefined;
    }
  }
  /**
   * Load protobuf file.
   * @description It sets protobuf root from file.
   * @returns {protobuf.Root} Reference to protobuf file root.
   */
  async loadProto(): Promise<protobuf.Root> {
    this.getModulePath();
    const protoPath = this.getModulePath();
    if (!protoPath) {
      Log.error('FileReader', 'Error geting path to proto file');
    }
    return protobuf.load(protoPath!);
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
