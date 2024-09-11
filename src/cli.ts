#!/usr/bin/env node
import { ECliOptions } from './enums/cli.js';
import Log from './tools/logger.js';

class App {
  init(): void {
    this.handleInit().catch((err) => {
      Log.error('Cli - main app', (err as Error).message);
    });
  }

  async handleInit(): Promise<void> {
    Log.logAll();

    return new Promise((resolve) => {
      const args = process.argv.splice(2) as ECliOptions | string[];

      if (args.length === 0) {
        this.defaultResponse();
        return resolve();
      }

      switch (args[0]) {
        case ECliOptions.TimeTravel:
          this.timeTravel();
          break;
        case ECliOptions.Help:
          this.help();
          break;
        default:
          Log.log('Cli', 'Provided unknown params. Use --help');
          break;
      }

      return resolve();
    });
  }

  private defaultResponse(): void {
    Log.log('Cli', 'No params provided. Use --help');
  }

  private timeTravel(): void {
    Log.log('Cli', 'This little maneuver is gonna cost us 51 years...');
  }

  private help(): void {
    Log.log('Cli', 'Help manu');
  }
}

new App().init();
