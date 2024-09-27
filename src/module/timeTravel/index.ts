import Log from '../../tools/logger.js';
import FileReader from '../fileReader/index.js';
import Proto from '../protobuf/index.js';
import type {
  ILogProto,
  ILogsProto,
  INotFormattedLogEntry,
  IFindParams,
  ITimeTravelReq,
  ITimeTravelStats,
  IToasterTimeTravel,
} from '../../../types/index.js';

export default class TimeTravel {
  private readonly _fileReader: FileReader;
  private _config: IToasterTimeTravel | null = null;
  private _total: ITimeTravelStats;

  constructor() {
    this._fileReader = new FileReader();
    this._total = { succeeded: { amount: 0, ids: [] }, failed: { amount: 0, ids: [] } };
  }

  private get config(): IToasterTimeTravel {
    return this._config!;
  }

  private set config(val: IToasterTimeTravel) {
    this._config = val;
  }

  private get fileReader(): FileReader {
    return this._fileReader;
  }

  private get total(): ITimeTravelStats {
    return this._total;
  }

  async init(config: IToasterTimeTravel, fileName?: string): Promise<void> {
    Log.debug('Time travel', 'Initiing');

    const logs = this.readLogs(fileName);
    this.config = config;
    const preparedLogs = await this.prepareLogs(logs.logs);
    await this.sendRequests(preparedLogs);

    this.cleanUp();
    this.presentData();
  }

  async decode(config: IToasterTimeTravel, fileName?: string): Promise<void> {
    Log.debug('Time travel', 'decoding');

    const logs = this.readLogs(fileName);
    this.config = config;
    const preparedLogs = await this.prepareLogs(logs.logs);
    Log.log('Logs', preparedLogs);
  }

  async find(config: IToasterTimeTravel, params: IFindParams): Promise<void> {
    Log.log('Time travel', 'Searching for files');
    Log.debug(
      'Time travel',
      'Searching',
      `key: ${params.keys.toString()}`,
      `ips: ${params.ips.toString()}`,
      `files: ${params.files.toString()}`,
      `json: ${JSON.stringify(params.json)}`,
    );

    // Data is limited to only first value on the list. Make sure to include all params

    const logs = this.readLogs(params.files[0]);
    this.config = config;
    const preparedLogs = await this.prepareLogs(logs.logs);
    const filteredLogs = preparedLogs.filter((log) => {
      let result = true;

      if (params.ips[0]) {
        if (!log[1].headers || !log[1].headers.host || log[1].headers.host !== params.ips[0]) {
          result = false; // it filters by host's address not ip, due to client's ip not being stored. Has to be changed later on
        }
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
    Log.log('Found requests', filteredLogs);
  }

  private readLogs(fileName?: string): ILogsProto {
    return this.fileReader.read(fileName);
  }

  private async sendRequests(logs: [string, INotFormattedLogEntry][]): Promise<void> {
    if (logs.length === 0) {
      Log.log('Time travel', 'No requests to send');
      return undefined;
    }

    await this.sendReq(logs[0]!);
    if (logs.length > 1) return this.sendRequests(logs.splice(1));
    return undefined;
  }

  private async sendReq(log: [string, INotFormattedLogEntry]): Promise<void> {
    Log.log('Time travel', `Sending req with id ${log[0]}`);
    Log.debug('Time travel', 'Sending req with body', log[1].body);

    const headers =
      log[1].headers && Object.keys(log[1].headers).length > 0
        ? (log[1].headers as Record<string, string>)
        : { 'Content-Type': 'application/json' };

    const method = log[1].method ?? 'GET';
    const fetchReq: ITimeTravelReq = {
      method,
      headers: {
        ...headers,
        'X-Toaster': 'true',
      },
      body: JSON.stringify(log[1].body) ?? '',
    };
    if (method === 'GET') {
      delete fetchReq.body;
    }

    const res = await fetch(`http://localhost:${this.config.port}`, fetchReq);

    if (res.ok) {
      this.total.succeeded.ids.push(log[0]);
      this.total.succeeded.amount++;
    } else {
      this.total.failed.ids.push(log[0]);
      this.total.failed.amount++;
    }
  }

  private cleanUp(): void {
    Log.debug('Time travel', 'Cleaning up');
  }

  private presentData(): void {
    if (this.total.failed.amount === 0 && this.total.succeeded.amount === 0) return;
    Log.log(
      'Time travel',
      'Presenting data',
      `Succeeded ${this.total.succeeded.amount} and failed ${this.total.failed.amount}`,
    );

    if (this.total.failed.amount > 0) {
      Log.warn('Failed reqs', this.total.failed.ids);
    }
  }

  async prepareLogs(logs: ILogProto): Promise<[string, INotFormattedLogEntry][]> {
    const proto = new Proto();
    const malformed: string[] = [];

    const prepared = await Promise.all(
      Object.entries(logs).map(async ([k, v]) => {
        const decodedLog = await proto.decodeLogEntry(v);
        try {
          return [
            k,
            {
              ...decodedLog,
              body: JSON.parse(decodedLog.body) as Record<string, unknown>,
              occured: new Date(decodedLog.occured).getTime(),
              queryParams: decodedLog.queryParams
                ? (JSON.parse(decodedLog.queryParams) as Record<string, unknown>)
                : {},
              headers: decodedLog.headers ? (JSON.parse(decodedLog.headers) as Record<string, unknown>) : {},
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
