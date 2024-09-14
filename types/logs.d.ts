import { IncomingHttpHeaders } from 'http';

export interface ILogEntry {
  method?: string;
  body: string;
  queryParams?:string
  headers?:string
  ip?: string;
  occured:string;
}

export interface INotFormattedLogEntry {
  method?: string;
  body: Record<string, unknown>;
  queryParams?: Record<string, string>;
  headers?: IncomingHttpHeaders;
  ip?: string;
  occured:number;
}

export interface ILogProto {
  [key: string]: string;
}

export interface ILog {
  [key: string]: ILogEntry;
}

export interface ILogsProto {
  logs: ILogProto;
}
export interface ILogs {
  logs: ILog;
}

export interface IIndexEntry {
  [key: string]: string;
}

export interface IIndex {
  indexes: IIndexEntry;
}
