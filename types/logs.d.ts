import { IncomingHttpHeaders } from 'http';

export interface ILogEntry {
  method?: string;
  body: string;
  queryParams?: Record<string, string>;
  headers?: IncomingHttpHeaders;
  ip?: string;
}

export interface INotFormattedLogEntry {
  method?: string;
  body: Record<string, unknown>;
  queryParams?: Record<string, string>;
  headers?: IncomingHttpHeaders;
  ip?: string;
}

export interface ILog {
  [key: string]: ILogEntry;
}

export interface ILogs {
  logs: ILog
}

export interface IIndexEntry {
  [key: string]: string
}

export interface IIndex {
  indexes: IIndexEntry
}
