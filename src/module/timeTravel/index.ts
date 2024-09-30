import Log from '../../tools/logger.js';
import { sleep } from '../../utils/index.js';
import FileReader from '../files/reader.js';
import Proto from '../protobuf/index.js';
import type {
  ILogProto,
  ILogsProto,
  INotFormattedLogEntry,
  ITimeTravelReq,
  ITimeTravelStats,
  IToasterTimeTravel,
} from '../../../types/index.js';
import readline from 'readline';

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

  /**
   * Initialize time travel.
   * @description Initialize time travel and send all requests.
   * @param config User's config.
   * @param fileName Target file.
   * @returns {void} Void.
   * @async
   */
  async init(config: IToasterTimeTravel, fileName?: string): Promise<void> {
    Log.debug('Time travel', 'Initiing');

    const logs = this.readLogs(fileName);
    this.config = config;
    const preparedLogs = await this.prepareLogs(logs.logs);
    await this.sendRequests(preparedLogs);

    this.cleanUp();
    this.presentData();
  }

  /**
   * Decode file.
   * @description Decode targeted file.
   * @param config User's config.
   * @param fileName Target file.
   * @returns {void} Void.
   * @async
   */
  async decode(config: IToasterTimeTravel, fileName?: string): Promise<void> {
    Log.debug('Time travel', 'Decoding');

    const logs = this.readLogs(fileName);
    this.config = config;
    const preparedLogs = await this.prepareLogs(logs.logs);
    Log.log('Logs', preparedLogs);
  }

  /**
   * Preload load.
   * @description Preload log file.
   * @param fileName Target file.
   * @returns {[string, INotFormattedLogEntry][]} Logs files.
   * @async
   */
  async preLoadLogs(fileName?: string): Promise<[string, INotFormattedLogEntry][]> {
    Log.debug('Time travel', 'Preloading logs');

    const logs = this.readLogs(fileName);
    return this.prepareLogs(logs.logs);
  }

  /**
   * Read logs file.
   * @description Read logs file.
   * @param fileName Target file.
   * @returns {ILogsProto} Log files.
   * @async
   * @private
   */
  private readLogs(fileName?: string): ILogsProto {
    return this.fileReader.init(fileName);
  }

  /**
   * Send requests created from logs.
   * @description Send requests read from log files.
   * @param logs Saved requests.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async sendRequests(logs: [string, INotFormattedLogEntry][]): Promise<void> {
    if (logs.length === 0) {
      Log.log('Time travel', 'No requests to send');
      return undefined;
    }

    await this.sendReq(logs[0]!);
    if (logs.length > 1) return this.sendRequests(logs.splice(1));
    return undefined;
  }

  /**
   * Send request using fetch.
   * @description Send request using fetch.
   * @param log Single request.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async sendReq(log: [string, INotFormattedLogEntry]): Promise<void> {
    Log.log('Time travel', `Sending req with id ${log[0]}`);
    if ((this.config.waitUntillNextReq ?? 0) > 0) {
      await sleep(this.config.waitUntillNextReq);
    }

    if (this.config.inputBeforeNextReq) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Press any button to continue', () => rl.close());
    }

    if (this.config.countTime) Log.time(log[0]);
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
    if (this.config.countTime) Log.endTime(log[0]);

    if (res.ok) {
      this.total.succeeded.ids.push(log[0]);
      this.total.succeeded.amount++;
    } else {
      this.total.failed.ids.push(log[0]);
      this.total.failed.amount++;
    }
  }

  /**
   * Remove all cached data.
   * @description Remove all cached data.
   * @returns {void} Void.
   * @private
   */
  private cleanUp(): void {
    Log.debug('Time travel', 'Cleaning up');
  }

  /**
   * Submit data for user.
   * @description Submit data for user.
   * @returns {void} Void.
   * @private
   */
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

  /**
   * Submit data for user.
   * @description Submit data for user.
   * @param logs Read logs from file.
   * @returns {[string, INotFormattedLogEntry][]} Prepared logs.
   * @async
   * @private
   */
  private async prepareLogs(logs: ILogProto): Promise<[string, INotFormattedLogEntry][]> {
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
