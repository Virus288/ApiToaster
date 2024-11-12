import FileWriter from './writer.js';
import Log from '../../tools/logger.js';
import TimeTravel from '../timeTravel/index.js';
import type { IFindParams, INotFormattedLogEntry } from '../../../types/index.js';

export default class FileFinder {
  private readonly _timeTravel: TimeTravel;
  private readonly _writer: FileWriter;
  constructor() {
    this._timeTravel = new TimeTravel();
    this._writer = new FileWriter();
  }

  private get timeTravel(): TimeTravel {
    return this._timeTravel;
  }

  private get writer(): FileWriter {
    return this._writer;
  }

  /**
   * Check for Object.
   * @description Checks if provaided object has nested objects.
   * @param examine Req.body or object nested in req.body.
   * @returns Objct or undefined.
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

    // Data is limited to only first value on the list. Make sure to include all params
    let logs: [string, INotFormattedLogEntry][];
    if (params.files.length === 0) {
      logs = await this.timeTravel.preLoadLogs(params.files[0]);
    } else {
      const promises = await Promise.all(
        params.files.map(async (file) => {
          const logFile = await this.timeTravel.preLoadLogs(file);
          return logFile;
        }),
      );
      logs = promises.flat();
    }

    Log.debug('File finder', 'Raw data', logs);
    if (params.ips.length > 0 && !logs[0]?.[1]?.ip) {
      Log.warn(
        'File finder',
        "Client's ip address is missing on first log on the list. Its possible that storing client's ip is disabled and search will not return anything, or just first entry does not include ip address.",
      );
    }

    const filteredLogs = logs.filter((log) => {
      let result = true;
      // @TODO: if result is false, break and return result
      // Check if ip is correct (only first ip in array is considered)
      if (params.ips.length > 0 && log[1].ip !== params.ips[0]) {
        Log.debug('File finder', 'Filtered log does not include required ip');
        result = false;
      }
      // JSON checking
      if (params.json) {
        // Check if req.body is a JSON, if not return false
        if (log[1].headers?.['content-type'] !== 'application/json') {
          Log.debug('File finder', 'Filtered log is not application json type');
          result = false;
        } else {
          // If req.body is correct check if it's content is matching
          if (!this.findJSON(log[1].body, params.json)) {
            Log.debug('File finder', 'Filtered log does not include provided body');
            result = false;
          }
        }
      }
      // Check for keys. All keys must be present in the body
      for (const key of params.keys) {
        if (key.length > 0 && !this.findKey(log[1].body, key)) {
          Log.debug('File finder', 'Filtered log does not include provided keys');
          result = false;
        }
      }
      // Check method. Only first method in the array is considered
      if (params.methods.length > 0 && params.methods[0] && log[1].method !== params.methods[0]) {
        Log.debug('File finder', 'Filtered log does not include provided method');
        result = false;
      }

      // Check for values. All values must be present in the body
      for (const value of params.values) {
        if (value.length > 0 && !this.findValue(log[1].body, value)) {
          Log.debug('File finder', 'Filtered log does not include privded values values');
          result = false;
        }
      }
      return result;
    });
    if (!filteredLogs[0]) {
      Log.warn('File finder', 'No logs has been found');
    }
    // @TODO: save filterdLogs to the file (I'm waiting for Marcin to finish his method that does similar thing)
    this.writer.save('found.json', filteredLogs);
    Log.log('Found requests', filteredLogs);
    return filteredLogs;
  }
}
