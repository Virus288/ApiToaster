#!/usr/bin/env node
import CliController from './cli/index.js';
import Log from './tools/logger.js';

class App {
  init(): void {
    new CliController().handleInit().catch((err) => {
      Log.error('Cli - main app', (err as Error).message);
    });
  }
}

new App().init();
