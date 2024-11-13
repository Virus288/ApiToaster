import Log from '../../tools/logger.js';
import { sleep } from '../../utils/index.js';
import FileReader from '../files/reader.js';
import FileWriter from '../files/writer.js';
import type {
  ILogs,
  ILogsProto,
  INotFormattedLogEntry,
  ITimeTravelReq,
  ITimeTravelStats,
  IToasterTimeTravel,
} from '../../../types/index.js';
import readline from 'readline';

export default class TimeTravel {
  private readonly _fileReader: FileReader;
  private readonly _fileWriter: FileWriter;
  private _config: IToasterTimeTravel | null = null;
  private _total: ITimeTravelStats;

  constructor() {
    this._fileReader = new FileReader();
    this._fileWriter = new FileWriter();
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

  public get fileWriter(): FileWriter {
    return this._fileWriter;
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
    const preparedLogs = await this.fileReader.prepareLogs(logs.logs);
    await this.sendRequests(preparedLogs);

    this.cleanUp();
    this.presentData();
  }
  private readLogs(filename?: string): ILogsProto | ILogs {
    return this.fileReader.init(filename);
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
    Log.debug('Time travel', 'Sending req');

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
}
