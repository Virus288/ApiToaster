export interface IConfig {
  path: string;
  method: boolean;
  body: boolean;
  queryParams: boolean;
  headers: boolean;
  ip: boolean;
  obfuscate: string[];
  disableProto: boolean;
}

export type IToasterConfig = Partial<IConfig>;

export type IConfigLog = Pick<IConfig, 'disableProto'>;
