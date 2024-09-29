import FileController from './controller.js';
import State from '../../tools/state.js';
import type { ILogs, ILogsProto } from '../../../types/index.js';

export default class FileReader {
  private _controller: FileController;

  constructor() {
    this._controller = new FileController();
  }

  private get controller(): FileController {
    return this._controller;
  }

  /**
   * Read logs files.
   * @description Get current or specified log file, read and return it for usage.
   * @param fileName Name of a file to be read.
   * @returns {ILogs} Saved logs.
   */
  init(fileName?: string): ILogsProto | ILogs {
    this.preRead();

    const file = this.controller.fetchCurrentLogFile(fileName);

    let logs;
    if (State.config.disableProto) {
      logs = this.controller.prepareLogJsonFile(file, true);
    } else {
      logs = this.controller.prepareLogfile(file, true);
    }
    return logs;
  }

  /**
   * Init basic files.
   * @description Initialize basic directories and files.
   * @returns {void} Void.
   */
  private preRead(): void {
    this.controller.initDirectories();
  }
}
