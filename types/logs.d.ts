import express from 'express';

export interface ILog {
  key: string;
  value: {
    path?: string;
    method?: string;
    body?: Record<string, unknown>|string;
    queryParams?: express.Request['query']|string;
    headers?: express.Request['headers']|string;
    ip?: string;
  };
}
