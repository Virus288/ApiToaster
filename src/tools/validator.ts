import * as errors from '../errors/index.js';

export default class Validation {
  private readonly _v: unknown;
  private readonly _name: string;

  constructor(v: unknown, name: string) {
    this._v = v;
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  get v(): unknown {
    return this._v;
  }

  isDefined(): this {
    const { v, name } = this;
    if (v === undefined || v === null) throw new errors.MissingArgError(name);

    return this;
  }

  isString(): this {
    const { v, name } = this;
    if (typeof v !== 'string') {
      throw new errors.IncorrectArgTypeError(`${name} should be a string`);
    }

    return this;
  }

  isNumber(): this {
    const { v, name } = this;
    if (typeof v !== 'number') throw new errors.IncorrectArgTypeError(`${name} should be number`);

    return this;
  }

  isObject(): this {
    const { v, name } = this;
    if (typeof v !== 'object' || Array.isArray(v)) {
      throw new errors.IncorrectArgTypeError(`${name} should be a object`);
    }

    return this;
  }
}
