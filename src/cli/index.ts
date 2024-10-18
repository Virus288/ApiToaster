import QueryBuilder from './queryBuilder.js';
import * as enums from '../enums/index.js';
import FileFinder from '../module/files/finder.js';
import TimeTravel from '../module/timeTravel/index.js';
import defaultConfig from '../tools/config.js';
import Log from '../tools/logger.js';
import State from '../tools/state.js';
import Validation from '../tools/validator.js';
import type { IToasterTimeTravel, ICliArgs } from '../../types/index.js';
import fs from 'fs';
import path from 'path';

export default class Cli {
  private readonly _timeTravel: TimeTravel;

  constructor() {
    this._timeTravel = new TimeTravel();
  }

  private get timeTravel(): TimeTravel {
    return this._timeTravel;
  }

  /**
   * Start cli.
   * @description Start cli and validate user's input.
   * @returns {void} Void.
   * @async
   */
  async handleInit(): Promise<void> {
    Log.debug('Cli', 'Initting');
    Log.logAll();

    const args = process.argv.splice(2) as ICliArgs;

    if (args.length === 0) {
      return Log.error('Cli', enums.ECliResponses.Default);
    }

    const command = args[0];

    switch (command) {
      case enums.ECliOptions.TimeTravel:
        return this.handleTimeTravel(args.slice(1));
      case enums.ECliOptions.Decode:
        return this.handleDecode(args.slice(1));
      case enums.ECliOptions.Migrate:
        return this.handleMigrate(args.slice(1));
      case enums.ECliOptions.Find:
        return this.handleFind(args.slice(1));
      case enums.ECliFlags.Help:
        return Log.log('Cli', enums.ECliResponses.Help);
      default:
        return Log.error('Cli', 'Provided unknown params. Use --help');
    }
  }

  /**
   * Start decodding.
   * @description Start decodding files.
   * @param args User's params.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async handleDecode(args: ICliArgs): Promise<void> {
    Log.debug('Cli', 'Handeling decode');

    const flag = args[0];
    const target = args[1];

    switch (flag) {
      case enums.ECliFlags.Path:
      case enums.ECliFlags.ShortPath:
        !target ? Log.error('Cli', 'Please provide file to decode.') : await this.decode(target);
        break;
      case enums.ECliFlags.SaveDecoded:
      case enums.ECliFlags.ShortSaveDecoded:
        !target ? Log.error('Cli', 'Please provide file to save decoded values.') : await this.saveDecoded(target);
        break;
      case enums.ECliFlags.Help:
      case enums.ECliFlags.ShortHelp:
        Log.log('Cli', enums.ECliResponses.DecodeHelp);
        break;
      case undefined:
      case null:
        await this.decode();
        break;
      default:
        Log.error('Cli', 'Unknown parameter.', enums.ECliResponses.TimeTravelUnknownCommand);
        break;
    }
  }

  /**
   * Start migrating.
   * @description Migrate logs json/proto.
   * @param args User's params.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async handleMigrate(args: ICliArgs): Promise<void> {
    Log.debug('Cli', 'Handling migration');

    const flag = args[0];
    const target = args[1];
    const logFormat = args[2];

    switch (flag) {
      case enums.ECliFlags.Path:
      case enums.ECliFlags.ShortPath:
        !target && !logFormat
          ? Log.error('Cli', 'Please provide file to decode and target format.')
          : await this.migrate(target, logFormat);
        break;
      case enums.ECliFlags.Help:
      case enums.ECliFlags.ShortHelp:
        Log.log('Cli', enums.ECliResponses.DecodeHelp);
        break;
      default:
        // TODO: change response
        Log.error('Cli', 'Unknown parameter.', enums.ECliResponses.TimeTravelUnknownCommand);
        break;
    }
  }
  /**
   * Start time travel.
   * @description Start time travel session.
   * @param args User's params.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async handleTimeTravel(args: ICliArgs): Promise<void> {
    Log.debug('Cli', 'Handeling time travel');

    const flag = args[0];
    const target = args[1];

    switch (flag) {
      case enums.ECliFlags.Path:
      case enums.ECliFlags.ShortPath:
        !target ? Log.error('Cli', 'Please provide a log file name.') : await this.initTimeTravel(target);
        break;
      case enums.ECliFlags.Help:
      case enums.ECliFlags.ShortHelp:
        Log.log('Cli', enums.ECliResponses.TimeTravelHelp);
        break;
      case undefined:
      case null:
        await this.initTimeTravel();
        break;
      default:
        Log.error('Cli', 'Unknown parameter.', enums.ECliResponses.TimeTravelUnknownCommand);
        break;
    }
  }

  /**
   * Start finding files.
   * @description Search for selected files.
   * @param args User's params.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async handleFind(args: ICliArgs): Promise<void> {
    Log.debug('Cli', 'Handeling find');

    this.readConfig();
    if (args[0] === enums.ECliFlags.Help || args[0] === enums.ECliFlags.ShortHelp) {
      Log.log('Cli', enums.ECliResponses.FindHelp);
    } else {
      const builder = new QueryBuilder(args);
      const params = builder.init();

      if (builder.isEmpty()) return Log.error('Cli', 'Malformed params');

      await new FileFinder().find(params);
    }
    return undefined;
  }

  /**
   * Start time traver.
   * @description Start time travel session.
   * @param fileName Target to use.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async initTimeTravel(fileName?: string): Promise<void> {
    Log.debug('Cli', 'Starting time travel');

    const config = this.readConfig();
    await this.timeTravel.init(config, fileName);
  }

  /**
   * Start decoding files.
   * @description Start decoding selected files.
   * @param fileName Target to use.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async decode(fileName?: string): Promise<void> {
    Log.debug('Cli', 'Decodding');

    this.readConfig();
    console.log("DECODEIDNE")
    const logs = await this.timeTravel.decode(fileName);
    Log.log('Logs', logs);
  }

  /**
   * Start decoding files.
   * @description Start decoding selected files.
   * @param fileName Target to use.
   * @param logFormat Target log format.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async migrate(fileName?: string, logFormat?: string): Promise<void> {
    Log.debug('Cli', 'Migrating');

    this.readConfig();
    await this.timeTravel.migrate(fileName, logFormat);
    // Log.log('Logs', logs);
  }
  /**
   * Start decoding files.
   * @description Start decoding selected files.
   * @param fileName Target to use.
   * @returns {void} Void.
   * @async
   * @private
   */
  private async saveDecoded(fileName?: string): Promise<void> {
    Log.debug('Cli', 'Decodding and saving to file');

    this.readConfig();
    await this.timeTravel.saveDecoded(fileName);
  }

  /**
   * Read application config.
   * @description Read time-travel config.
   * @returns {void} Void.
   * @async
   * @throws {Error} Throw new error whenever config is malformed.
   * @private
   */
  private readConfig(): IToasterTimeTravel {
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

  /**
   * Vallidate config.
   * @description Validate time-travel config.
   * @param config User's config.
   * @returns {void} Void.
   * @async
   * @private
   */
  private validateConfig(config: IToasterTimeTravel): void {
    Log.debug('Cli', 'Validating config');

    new Validation(config, 'config').isDefined().isObject();
    new Validation(config.port, 'config.port').isDefined().isNumber();
    if (config.countTime) new Validation(config.countTime, 'config.countTime').isDefined().isNumber();
    if (config.path) new Validation(config.path, 'config.path').isDefined().isString();
    if (config.waitUntillNextReq)
      new Validation(config.waitUntillNextReq, 'config.waitUntillNextReq').isDefined().isNumber();
    if (config.inputBeforeNextReq)
      new Validation(config.inputBeforeNextReq, 'config.inputBeforeNextReq').isDefined().isBoolean();
  }
}
