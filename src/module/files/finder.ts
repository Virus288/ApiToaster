import Log from '../../tools/logger.js';
import TimeTravel from '../timeTravel/index.js';
import type { IFindParams, INotFormattedLogEntry } from '../../../types/index.js';

export default class FileFinder {
  private readonly _timeTravel: TimeTravel;

  constructor() {
    this._timeTravel = new TimeTravel();
  }

  private get timeTravel(): TimeTravel {
    return this._timeTravel;
  }

  private checkForObj(examine: Record<string, unknown>): undefined | Record<string, unknown>[] {
    const array = Object.values(examine).filter((value) => {
      return typeof value === 'object';
    }) as Record<string, unknown>[];
    return array[0] ? array : undefined;
  }

  private checkForJSON(examine: Record<string, unknown>, json: Record<string, unknown>): boolean {
    return (
      Object.keys(json).every((key) => Object.hasOwn(examine, key)) &&
      Object.keys(json).every((key) => {
        return examine[`${key}`] === json[`${key}`];
      })
    );
  }

  private findValue(examine: Record<string, unknown>, value: string): boolean {
    let result = false;
    const keyResult = Object.values(examine).includes(value);
    const objResult = this.checkForObj(examine);
    if (keyResult) {
      result = true;
    } else if (!objResult) {
      result = false;
    } else if (!keyResult && objResult) {
      objResult?.forEach((obj) => {
        result = this.findValue(obj, value);
      });
    }
    return result;
  }

  private findKey(examine: Record<string, unknown>, key: string): boolean {
    let result = false;
    const keyResult = Object.hasOwn(examine, key);
    const objResult = this.checkForObj(examine);
    if (keyResult) {
      result = true;
    } else if (!objResult) {
      result = false;
    } else if (!keyResult && objResult) {
      objResult?.forEach((obj) => {
        result = this.findKey(obj, key);
      });
    }
    return result;
  }

  private findJSON(examine: Record<string, unknown>, json: Record<string, unknown>): boolean {
    let result = false;
    const jsonResult = this.checkForJSON(examine, json);
    const objResult = this.checkForObj(examine);
    if (jsonResult) {
      result = true;
    } else if (!objResult) {
      result = false;
    } else if (!jsonResult && objResult) {
      objResult?.forEach((obj) => {
        result = this.findJSON(obj, json);
      });
    }
    return result;
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
    );
    // Data is limited to only first value on the list. Make sure to include all params
    const logs = await this.timeTravel.preLoadLogs(params.files[0]);

    Log.debug('File finder', 'Raw data', logs);
    if (params.ips.length > 0 && !logs[0]?.[1]?.ip) {
      Log.warn(
        'File finder',
        "Client's ip address is missing on first log on the list. Its possible that storing client's ip is disabled and search will not return anything, or just first entry does not include ip address.",
      );
    }

    const filteredLogs = logs.filter((log) => {
      let result = true;
      if (params.ips.length > 0 && log[1].ip !== params.ips[0]) {
        Log.debug('File finder', 'Filtered log does not include required ip');
        result = false;
      }

      if (params.json) {
        if (log[1].headers?.['content-type'] !== 'application/json') {
          Log.debug('File finder', 'Filtered log is not application json type');
          // If I undefined correctly, data that came here is validated if its json or not. If its not, do not run next steps
          // Done. At least i think so...
          result = false;
        } else {
          // This is bad. We should parse all data and make sure that key and value does exist in each other. Also we are not looking for nested keys.
          // Rewrite this, so it will search for keys and them values of those keys in filtered data. This way of searching for data might not work correctly
          // Done, i think...
          if (!this.findJSON(log[1].body, params.json)) {
            Log.debug('File finder', 'Filtered log does not include provided body');
            result = false;
          }
        }
      }

      // This is bad. We are not looking for nested keys
      // Replace this for Object.keys(log.body).includes() and filter one by one
      for (const key of params.keys) {
        if (key.length > 0 && !this.findKey(log[1].body, key)) {
          Log.debug('File finder', 'Filtered log does not include provided keys');
          result = false;
        }
      }

      // This is bad. We are not looking for nested keys
      // Replace this for Object.keys(log.body).includes() and filter one by one
      if (params.methods.length > 0 && params.methods[0] && log[1].method !== params.methods[0]) {
        Log.debug('File finder', 'Filtered log does not include provided keys');
        result = false;
      }

      // This is bad.We are not looking for nested values
      for (const value of params.values) {
        if (value.length > 0 && !this.findValue) {
          Log.debug('File finder', 'Filtered log does not include privded values values');
          result = false;
        }
      }

      return result;
    });
    // If not req found, create different response. Response shold be stringified json, but in readable format ( with proper spaces )
    if (!filteredLogs[0]) {
      Log.warn('File finder', 'No logs has been found');
    }

    // In addition to that, save found logs in decoded file called "found.json". If file exists, remove it
    Log.log('Found requests', filteredLogs);
    return filteredLogs;
  }
}
