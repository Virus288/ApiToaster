import type { IConfig } from '../../types';
import path from 'path';

/**
 * Function to get path.
 * @description Function used to get the path of current project directory.
 * @returns Path of project directory.
 */
function getPath(): string {
  return (import?.meta?.dirname) ?? path.resolve(__dirname);
}

export default function(): IConfig {
  return {
    path: getPath(),
    method: true,
    body: true,
    getRequest: true,
    queryParams: true,
    obfuscate: ['password'],
  };
}
