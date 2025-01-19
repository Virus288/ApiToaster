import type { IConfig, IState, IToasterTimeTravel } from '../../types';

class State implements IState {
  private _config: IConfig | null = null;
  private _toasterConfig: IToasterTimeTravel | null = null;
  private _reqUuid: string | null = null;

  get config(): IConfig {
    return this._config as IConfig;
  }

  set config(val: IConfig) {
    this._config = val;
  }

  get reqUuid(): string {
    return this._reqUuid as string;
  }

  set reqUuid(val: string | null) {
    this._reqUuid = val;
  }

  get toasterConfig(): IToasterTimeTravel {
    return this._toasterConfig as IToasterTimeTravel;
  }

  set toasterConfig(value: IToasterTimeTravel) {
    this._toasterConfig = value;
  }
}

export default new State();
