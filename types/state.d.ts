import type { IConfig } from './config.js';

export interface IState {
  config: IConfig;
  reqUuid: string;
}
