import Log from '../../tools/logger.js';
import FileReader from '../fileReader.js';
import type { ILog, ILogs, INotFormattedLogEntry } from '../../../types/logs.js';
import type { ITimeTravelStats, IToasterTimeTravel } from '../../../types/timeTravel.js';

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

  async init(config: IToasterTimeTravel): Promise<void> {
    Log.debug('Time travel', 'Initiing');

    const logs = this.readLogs();
    this.config = config;
    const preparedLogs = this.prepareLogs(logs.logs);
    await this.sendRequests(preparedLogs);

    this.cleanUp();
    this.presentData();
  }

  private readLogs(): ILogs {
    return this.fileReader.read();
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

    const res = await fetch(`http://localhost:${this.config.port}`, {
      method: 'POST',
      headers: (log[1].headers as Record<string, string>) ?? {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log[1].body) ?? '',
    });

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

  private prepareLogs(logs: ILog): [string, INotFormattedLogEntry][] {
    const malformed: string[] = [];

    const prepared = Object.entries(logs)
      .map(([k, v]) => {
        try {
          return [k, { ...v, body: JSON.parse(v.body) as Record<string, unknown> } as INotFormattedLogEntry];
        } catch (_err) {
          if (
            v.body &&
            typeof v.body === 'object' &&
            !Array.isArray(v.body) &&
            v.body !== null &&
            Object.keys(v.body).length > 0
          ) {
            Log.debug('Time travel', `Log ${k} seems to be a object type instead of json type`);
            return [k, v] as unknown as [string, INotFormattedLogEntry];
          }

          malformed.push(k);
          return null;
        }
      })
      .filter((e) => e);

    if (malformed.length > 0) {
      Log.error(
        'Time travel',
        `Seems that logs ${malformed.join(', ')} were malformed. Currently this application cannot remove malformed logs. Please remove them manually, or via desktop app`,
      );
    }

    Log.debug('Time travel', 'Formatted logs', JSON.stringify(prepared));

    return prepared as [string, INotFormattedLogEntry][];
  }
}
