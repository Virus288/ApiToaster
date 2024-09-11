import type { IConfig, IState } from '../../types';

class State implements IState {
  private _config: IConfig | null = null;

  get config(): IConfig {
    return this._config as IConfig;
  }

  set config(val: IConfig) {
    this._config = val;
  }
}

export default new State();
