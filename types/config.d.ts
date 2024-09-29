export interface IConfig {
  path: string;
  method: boolean;
  body: boolean;
  queryParams: boolean;
  headers: boolean;
  ip: boolean;
  obfuscate: string[];
  countTime: boolean
}

export type IToasterConfig = Partial<IConfig>

