import Log from './logger.js';
import State from './state.js';
import type { ILog } from '../../types';
import type express from 'express';
import fs from 'fs';
import path from 'path';

/**
 *  Function to initialize directories and files
 *  on given path.
 * @returns Path to log file.
 */
function initDirectories(): string | undefined {
  if (!State.state.path) {
    Log.error('Log', 'No path provided');
    return undefined;
  }
  const dirPath = path.resolve(State.state.path, 'Toaster');
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (error) {
      Log.error('Initialize directories', 'Make Directory', error);
    }
  }

  const logPath = path.resolve(dirPath, 'logs.json');
  if (!fs.existsSync(logPath)) {
    try {
      fs.writeFileSync(logPath, JSON.stringify([]));
    } catch (error) {
      Log.error('Initialize directories', 'Writing File', error);
    }
  }
  return logPath;
}
/**
 *  Function to obfuscate provided in config fields.
 * @param log Single log.
 */
function obfuscate(log: ILog): void {
  State.state.obfuscate?.forEach((field) => {
    if (field in log.value) {
      log.value[field as keyof ILog['value']] = '***';
    }
  });
}
/**
 *  Function to save a log into a file.
 * @param req Express request.
 */
export default function(req: express.Request): void {
  const logPath = initDirectories();
  if (!logPath) {
    return;
  }
  const fileSize = fs.statSync(logPath).size;
  if (fileSize === 0) {
    fs.writeFileSync(logPath, JSON.stringify([]));
  }
  const newLog: ILog = {
    key: 'randomString',
    value: {
      method: State.state.method ? req.method : undefined,
      body: State.state.body ? (req.body as Record<string, unknown>) : undefined,
      queryParams: State.state.queryParams ? req.query : undefined,
      headers: State.state.headers ? req.headers : undefined,
      ip: State.state.ip ? req.ip : undefined,
    },
  };

  obfuscate(newLog);

  let logs: ILog[] = [];
  try {
    const data = fs.readFileSync(logPath).toString();
    logs = JSON.parse(data) as ILog[];
  } catch (error) {
    Log.error('Parse data', error);
  }

  logs.push(newLog);
  try {
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (error) {
    Log.error('Save File', error);
  }
}
