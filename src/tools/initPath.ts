import defaultConfig from './config.js';
import State from './state.js';
import type { IConfig } from '../../types/config.js';
import path from 'path';

/**
 *  Function to initialize directories and files
 *  on given path.
 * @param config Configuration for middleware.
 */
export default function(config?: IConfig): void {
  if (config?.path) {
    const root = process.cwd();
    const str = config.path.startsWith('/') ? config.path.slice(1) : config.path;
    const dirPath = path.resolve(root, str);
    State.state = { ...config, path: dirPath };
  } else {
    State.state = defaultConfig();
  }
}
