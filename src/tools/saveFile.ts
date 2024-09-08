import Log from './logger.js';
import State from './state.js';
import type express from 'express';
import fs from 'fs';
import { ILog } from '../../types';
import path from 'path';

export default function(_req: express.Request) {
  if (!State.state.path) {
    return;
  }
  const dirPath = path.resolve(State.state.path, 'Toaster');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const logPath = path.resolve(dirPath, 'logs.json');
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, JSON.stringify([]));
  }
  const newLog: ILog = {
    key: 'randomString',
    value: {
      method: State.state.method ? _req.method : undefined,
      path: State.state.path ? _req.path : undefined,
      body: State.state.body ? _req.body : undefined,
      queryParams: State.state.queryParams ? _req.query : undefined,
      headers: State.state.headers ? _req.headers : undefined,
      ip: State.state.ip ? _req.ip : undefined,
      obfuscate: State.state.obfuscate ?? [],
    },
  };
  let logs: ILog[] = [];
  try {
    const data = fs.readFileSync(logPath).toString();
    logs = JSON.parse(data) as ILog[];
  } catch (error) {
    Log.error('Save File', error);
  }

  logs.push(newLog);
  try {
    fs.writeFileSync(logPath, JSON.stringify(logs));
  } catch (error) {
    Log.error('Save File', error);
  }
}
