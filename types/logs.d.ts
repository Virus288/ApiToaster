import express from 'express';

export interface ILog {
  key: string;
  value: {
    path?: string;
    method?: express.Request['method'];
    body?: express.Request['body'];
    queryParams?: express.Request['query'];
    headers?: express.Request['headers'];
    ip?: express.Request['ip'];
    obfuscate: string[];
  };
}
