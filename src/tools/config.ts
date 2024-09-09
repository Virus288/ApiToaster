import type { IConfig } from '../../types';

/**
 * Function to get path.
 * @description Function used to get the path of current project directory.
 * @returns Path of project directory.
 */
function getPath(): string {
  return process.cwd();
}

/**
 * Function to get default config .
 * @returns Configuration for a logging middleware.
 */
export default function (): IConfig {
  return {
    path: getPath(),
    method: true,
    body: true,
    queryParams: true,
    headers: false,
    ip: false,
    obfuscate: ['password'],
  };
}
