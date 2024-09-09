import type { IConfig } from '../../types';

export default class State {
  private static _state: IConfig;

  public static get state(): IConfig {
    return this._state;
  }
  public static set state(value: IConfig) {
    this._state = value;
  }
}
