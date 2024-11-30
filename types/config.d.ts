export interface IConfig {
  path: string;
  shouldThrow?: boolean;
  method: boolean;
  body: boolean;
  queryParams: boolean;
  headers: boolean;
  ip: boolean;
  obfuscate: string[];
  disableProto: boolean;
  statusCode: boolean;
  countTime: boolean;
  logFileSize: number;
}

export type IToasterConfig = Partial<IConfig>;

export interface IPreviousSettings {
  disableProto: boolean;
}
