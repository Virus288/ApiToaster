#!/usr/bin/env node
import { ECliOptions } from './enums/cli.js';
import TimeTravel from './module/timeTravel/index.js';
import defaultConfig from './tools/config.js';
import Log from './tools/logger.js';
import State from './tools/state.js';
import Validation from './tools/validator.js';
import type { IToasterTimeTravel } from '../types/index.js';
import fs from 'fs';
import path from 'path';

class App {
  private readonly _timeTravel: TimeTravel;
  constructor() {
    this._timeTravel = new TimeTravel();
  }

  private get timeTravel(): TimeTravel {
    return this._timeTravel;
  }

  init(): void {
    this.handleInit().catch((err) => {
      Log.error('Cli - main app', (err as Error).message);
    });
  }

  async handleInit(): Promise<void> {
    Log.logAll();

    const args = process.argv.splice(2) as ECliOptions | string[];

    if (args.length === 0) {
      this.defaultResponse();
      return;
    }

    switch (args[0]) {
      case ECliOptions.TimeTravel:
        if (args[1] === '-p') {
          if (!args[2]) {
            Log.error('Cli', 'Please provide a log file name.');
          } else {
            await this.initTimeTravel(args[2]);
          }
        } else if (!args[1]) {
          await this.initTimeTravel();
        } else {
          Log.error('Cli', 'Unknown parameter.');
          Log.log(
            'Cli',
            '\nAvailable parameters for time-travel:\n\t-p filename : provide filename to run command on.',
          );
        }
        break;
      case ECliOptions.Decode:
        if (args[1] === '-p') {
          if (!args[2]) {
            Log.error('Cli', 'Please provide a file to decode.');
          } else {
            await this.decode(args[2]);
          }
        } else if (!args[1]) {
          await this.decode();
        } else {
          Log.error('Cli', 'Unknown parameter.');
          Log.log('Cli', '\nAvailable parameters for decode:\n\t-p filename : provide filename to decode.');
        }
        break;
      case ECliOptions.Help:
        this.help();
        break;
      default:
        Log.log('Cli', 'Provided unknown params. Use --help');
        break;
    }
  }

  private defaultResponse(): void {
    Log.log('Cli', 'No params provided. Use --help');
  }

  private help(): void {
    Log.log(
      'Cli-help',
      '\nApiToaster - application middleware for registring, storing and analizing incoming request\n\tUsage: npx api-toaster [param] \n\tParams:\n\t\ttime-travel: resends stored request\n\t\tdecode: logs stored requests\n\n\tNote: if no argument is provided, functions look only at last log_[i].json file',
    );
  }

  private async initTimeTravel(fileName?: string): Promise<void> {
    Log.log('Cli', 'Starting');
    const config = this.readToasterConfig();
    await this.timeTravel.init(config, fileName);
  }
  private async decode(fileName?: string): Promise<void> {
    Log.log('Cli', 'Starting');
    const config = this.readToasterConfig();
    await this.timeTravel.decode(config, fileName);
  }

  private readToasterConfig(): IToasterTimeTravel {
    Log.debug('Cli', 'Reading config');
    if (!fs.existsSync(path.join(process.cwd(), 'toaster.json'))) {
      throw new Error('Missing toaster config');
    }

    try {
      const file = fs.readFileSync(path.join(process.cwd(), 'toaster.json'));
      const config = JSON.parse(file.toString()) as IToasterTimeTravel;
      this.validateConfig(config);

      State.config = { ...defaultConfig() };
      if (config.path) State.config.path = config.path;

      return config;
    } catch (_err) {
      throw new Error('Malformed toaster config');
    }
  }

  private validateConfig(config: IToasterTimeTravel): void {
    Log.debug('Cli', 'Validating config');

    new Validation(config, 'config').isDefined().isObject();
    new Validation(config.port, 'config.port').isDefined().isNumber();
    if (config.path) new Validation(config.path, 'config.path').isDefined().isString();
  }
}

new App().init();
