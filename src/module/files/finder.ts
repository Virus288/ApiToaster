import Log from '../../tools/logger.js';
import TimeTravel from '../timeTravel/index.js';
import type { IFindParams } from '../../../types/index.js';

export default class FileFinder {
  private readonly _timeTravel: TimeTravel;

  constructor() {
    this._timeTravel = new TimeTravel();
  }

  private get timeTravel(): TimeTravel {
    return this._timeTravel;
  }

  async find(params: IFindParams): Promise<void> {
    Log.log('File finder', 'Searching for files');
    Log.debug(
      'File finder',
      'Searching',
      `key: ${params.keys.toString()}`,
      `ips: ${params.ips.toString()}`,
      `files: ${params.files.toString()}`,
      `json: ${JSON.stringify(params.json)}`,
    );

    // Data is limited to only first value on the list. Make sure to include all params

    const logs = await this.timeTravel.preLoadLogs(params.files[0]);

    if (params.ips.length > 0 && !logs[0]?.[1]?.ip) {
      Log.warn(
        'File finder',
        "Client's ip address is missing on first log on the list. Its possible that storing client's ip is disabled and search will not return anything.",
      );
    }

    const filteredLogs = logs.filter((log) => {
      let result = true;

      if (log[1].ip !== params.ips[0]) {
        result = false;
      }

      if (params.json) {
        if (log[1].headers?.['content-type'] !== 'application/json') {
          // If I undefined correctly, data that came here is validated if its json or not. If its not, do not run next steps
          result = false;
        }

        // This is bad. We should parse all data and make sure that key and value does exist in each other. Also we are not looking for nested keys
        if (!JSON.stringify(log[1].body).includes(JSON.stringify(params.json))) {
          result = false;
        }
      }

      // This is bad. We are not looking for nested keys
      if (params.keys[0]) {
        if (!log[1].body[`${params.keys[0]}`]) {
          result = false;
        }
      }

      // This is bad.We are not looking for nested values
      if (params.values[0]) {
        if (!Object.values(log[1].body).includes(params.values[0])) {
          result = false;
        }
      }

      return result;
    });

    // If not req found, create different response. Response shold be stringified json, but in readable format ( with proper spaces )
    // In addition to that, save found logs in decoded file called "found.json". If file exists, remove it
    Log.log('Found requests', filteredLogs);
  }
}
