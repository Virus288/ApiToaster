import express from 'express';

export interface ILogEntry {
  method?: string;
  body?: Record<string, unknown> | string;
  queryParams?: express.Request['query'] | string;
  headers?: express.Request['headers'] | string;
  ip?: string;
}
export interface ILog {
  [key: string]: ILogEntry;
}

export interface ILogs {
  logs:ILog
}
export interface IIndexEntry{
  [key:string]:string
}
export interface IIndex{
  indexes:IIndexEntry
}
