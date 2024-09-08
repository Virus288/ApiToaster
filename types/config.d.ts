export interface IConfig {
  path?: string;
  method?: boolean;
  body?: boolean;
  getRequest?: boolean;
  queryParams?: boolean;
  headers?: boolean;
  ip?: boolean;
  obfuscate?: string[];
}
