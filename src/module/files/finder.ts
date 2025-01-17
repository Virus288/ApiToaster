import FileReader from './reader.js';
import FileWriter from './writer.js';
import Log from '../../tools/logger.js';
import Utils from '../utils/index.js';
import type { IFindParams, INotFormattedLogEntry } from '../../../types/index.js';
import type { IncomingHttpHeaders } from 'http2';
// import readline from 'readline';

export default class FileFinder {
  private readonly _reader: FileReader;
  private readonly _writer: FileWriter;
  private readonly _utils: Utils;
  constructor() {
    this._reader = new FileReader();
    this._writer = new FileWriter();
    this._utils = new Utils(this._reader, this._writer);
  }

  private get reader(): FileReader {
    return this._reader;
  }

  private get writer(): FileWriter {
    return this._writer;
  }

  private get utils(): Utils {
    return this._utils;
  }

  /**
   * Get array of logs.
   * @description Reads and returns logs using provided search params.
   * @param params Search parameters provided by user.
   * @returns Promise<[string, INotFormattedLogEntry][]>.
   */
  private async getLogs(params: IFindParams): Promise<[string, INotFormattedLogEntry][]> {
    if (params.files.length === 0) {
      const logs = await this.reader.preLoadLogs(params.files[0]);
      await this.utils.promptMalformedLogDeletion();
      return logs;
    }
    const logPromises = params.files.map((file) => this.reader.preLoadLogs(file));
    const logEntries = await Promise.all(logPromises);
    return logEntries.flat();
  }

  /**
   * Check for Object.
   * @description Checks if provaided object has nested objects.
   * @param examine Req.body or object nested in req.body.
   * @returns Object or undefined.
   */
  private checkForObj(examine: Record<string, unknown>): undefined | Record<string, unknown>[] {
    const array = Object.values(examine).filter((value) => typeof value === 'object') as Record<string, unknown>[];
    return array.length > 0 ? array : undefined;
  }

  /**
   * Checks if provaided json key:vlaue pairs are present in given object.
   * @param examine Req.body or object nested in req.body.
   * @param json Key:value pair provided by the user.
   * @returns Boolean.
   */
  private checkForJSON(examine: Record<string, unknown>, json: Record<string, unknown>): boolean {
    return Object.keys(json).every((key) => Object.hasOwn(examine, key) && examine[key] === json[key]);
  }

  /**
   *  Find values in provided req.body and nested object.
   * @param examine Req.body or object nested in req.body.
   * @param value String Value provided by the user.
   * @returns Boolean.
   */
  private findValue(examine: Record<string, unknown>, value: string): boolean {
    if (Object.values(examine).includes(value)) return true;

    const objResult = this.checkForObj(examine);
    if (!objResult) return false;
    return objResult.some((obj) => this.findValue(obj, value));
  }

  /**
   * Find keys in provided req.body and nested object.
   * @param examine Req.body or object nested in req.body.
   * @param key String Key provided by the user.
   * @returns Boolean.
   */
  private findKey(examine: Record<string, unknown>, key: string): boolean {
    if (Object.hasOwn(examine, key)) return true;

    const nestedObjects = this.checkForObj(examine);
    if (!nestedObjects) return false;

    return nestedObjects.some((obj) => this.findKey(obj, key));
  }

  /**
   *  Find key:value pairs in req.body or nested objects.
   * @param examine Req.body or object nested in req.body.
   * @param json Key:values pairs provided by the user.
   * @returns Boolean.
   */
  private findJSON(examine: Record<string, unknown>, json: Record<string, unknown>): boolean {
    if (this.checkForJSON(examine, json)) return true;

    const nestedObjects = this.checkForObj(examine);
    if (!nestedObjects) return false;

    return nestedObjects.some((obj) => this.findJSON(obj, json));
  }

  private checkForHeaders(headers: IncomingHttpHeaders | undefined): boolean {
    return !headers || Object.keys(headers).length === 0;
  }
  private checkForBodyParam(params: IFindParams): boolean {
    return Object.keys(params.json).length !== 0 || Boolean(params.keys[0]) || Boolean(params.values[0]);
  }
  /**
   * Find data.
   * @description Find data in files.
   * @param params Find params provided by user.
   * @returns {Promise<[string, INotFormattedLogEntry][]>} Void.
   * @async
   */
  async find(params: IFindParams): Promise<[string, INotFormattedLogEntry][]> {
    Log.log('File finder', 'Searching for files');
    Log.debug(
      'File finder',
      'Searching',
      `key: ${params.keys.toString()}`,
      `ips: ${params.ips.toString()}`,
      `files: ${params.files.toString()}`,
      `json: ${JSON.stringify(params.json)}`,
      `methods: ${params.methods.toString()}`,
      `codes: ${params.statusCodes.toString()}`,
    );

    const logs = await this.getLogs(params);

    Log.debug('File finder', 'Raw data', logs);
    if (params.ips.length > 0 && !logs[0]?.[1]?.ip) {
      Log.warn(
        'File finder',
        "Client's ip address is missing on first log on the list. Its possible that storing client's ip is disabled and search will not return anything, or just first entry does not include ip address.",
      );
    }

    const filteredLogs = logs.filter((log) => {
      // Check if ip is correct (only first ip in array is considered)
      if (params.ips.length > 0 && log[1].ip !== params.ips[0]) {
        Log.debug('File finder', `Log ${log[0]} does not include required ip`);
        return false;
      }

      // Check for statusCode. If multiple values are being provided by the user, only first is consider
      if (params.statusCodes.length > 0 && params.statusCodes[0] && log[1].statusCode !== params.statusCodes[0]) {
        Log.debug('File finder', `Log ${log[0]} does not include required statusCode`);
        return false;
      }
      // Check method. Only first method in the array is considered
      if (params.methods.length > 0 && params.methods[0] && log[1].method !== params.methods[0]) {
        Log.debug('File finder', `Log ${log[0]} does not include provided method`);
        return false;
      }

      // Check if headers are present and inform user if not
      if (!params.force && this.checkForHeaders(log[1].headers) && this.checkForBodyParam(params)) {
        Log.warn(
          'File finder',
          `There are no headers saved for log ${log[0]}. Body and headers search is disable for this log. If you want to run these searches use --force flag`,
        );
        return false;
      }

      // Check if req.body is a JSON, if not return false
      if (Object.keys(params.json).length !== 0 && log[1].headers?.['content-type'] !== 'application/json') {
        Log.debug('File finder', `Log ${log[0]} is not a json`);
        return false;
      }

      // If req.body is correct check if it's content is matching
      if (Object.keys(params.json).length !== 0 && !this.findJSON(log[1].body, params.json)) {
        Log.debug('File finder', `Log ${log[0]} does not include provided json`);
        return false;
      }

      // Check for keys. All keys must be present in the body
      for (const key of params.keys) {
        if (key.length > 0 && !this.findKey(log[1].body, key)) {
          Log.debug('File finder', `Log ${log[0]} does not include provided key`);
          return false;
        }
      }
      // Check for values. All values must be present in the body
      for (const value of params.values) {
        if (value.length > 0 && !this.findValue(log[1].body, value)) {
          Log.debug('File finder', `Log ${log[0]} does not include provided value`);
          return false;
        }
      }
      return true;
    });

    if (!filteredLogs[0]) {
      Log.warn('File finder', 'No logs has been found');
    }
    this.writer.save('found.json', filteredLogs);
    Log.log('Found requests', filteredLogs);
    return filteredLogs;
  }
}
