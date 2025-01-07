import * as enums from '../enums/index.js';
import Log from '../tools/logger.js';
import Validation from '../tools/validator.js';
import type { IUnificationParams, ICliArgs, IUnifiactionKey } from '../../types/index.js';

export default class QueryBuilder {
  private _lastCommmand: enums.ECliFlags | undefined = undefined;
  private _params: IUnificationParams = {
    files: [],
    values: [],
  };
  private _args: ICliArgs;

  constructor(args: ICliArgs) {
    this._args = args;
  }

  private get lastCommmand(): enums.ECliFlags | undefined {
    return this._lastCommmand;
  }

  private set lastCommmand(val: enums.ECliFlags | undefined) {
    this._lastCommmand = val;
  }

  private get args(): ICliArgs {
    return this._args;
  }

  private set args(val: ICliArgs) {
    this._args = val;
  }

  private get params(): IUnificationParams {
    return this._params;
  }

  private set params(value: IUnificationParams) {
    this._params = value;
  }

  /**
   * Start query builder.
   * @description Start query builder and generate all queries..
   * @returns {IFindParams} Parameters found in config.
   */
  init(): IUnificationParams {
    if (this.args.length === 0) return this.params;
    const target = this.args[0];

    switch (target) {
      case enums.ECliFlags.ShortPath:
      case enums.ECliFlags.Path:
      case enums.ECliFlags.Value:
      case enums.ECliFlags.ShortValue:
        this.lastCommmand = target;
        break;

      default:
        this.addParam(target as string);
        break;
    }

    this.args = this.args.slice(1);
    return this.init();
  }

  isEmpty(): boolean {
    return this.params.values.length === 0 && this.params.files.length === 0;
  }

  /**
   * Init query builder.
   * @description Start query builder and generate all queries.
   * @param target User's argument.
   * @returns {void} Void.
   * @private
   */
  private addParam(target: string): void {
    if (!this.lastCommmand) return Log.error('QueryBuilder', 'Tried to add param without providing flag for its type.');

    switch (this.lastCommmand) {
      case enums.ECliFlags.ShortPath:
      case enums.ECliFlags.Path:
        this.params.files.push(target);
        break;
      case enums.ECliFlags.Value:
      case enums.ECliFlags.ShortValue:
        new Validation(target, 'Passed value').isIUnificationKey();
        this.params.values.push(target as IUnifiactionKey);
        break;
      default:
        Log.error('QueryBuilder', 'About to add param for unsupported commannd.');
    }

    return undefined;
  }
}
