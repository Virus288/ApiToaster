import Log from '../../tools/logger.js';
import FileController from '../files/controller.js';
import FileReader from '../files/reader.js';
import FileWriter from '../files/writer.js';
import Utils from '../utils/index.js';
import type { ILogs, ILogsProto, INotFormattedLogEntry } from '../../../types';

export default class Decoder {
  private readonly _fileController: FileController;
  private readonly _fileWriter: FileWriter;
  private readonly _fileReader: FileReader;
  private readonly _utils: Utils;

  constructor() {
    this._fileController = new FileController();
    this._fileWriter = new FileWriter();
    this._fileReader = new FileReader();
    this._utils = new Utils(this._fileReader, this._fileWriter);
  }

  private get fileController(): FileController {
    return this._fileController;
  }

  private get fileWriter(): FileWriter {
    return this._fileWriter;
  }

  private get fileReader(): FileReader {
    return this._fileReader;
  }

  private get utils(): Utils {
    return this._utils;
  }
  /**
   * Decode file.
   * @description Decode targeted file.
   * @param fileName Target file.
   * @returns {void} Void.
   * @async
   */
  async init(fileName?: string): Promise<[string, INotFormattedLogEntry][]> {
    Log.debug('Decoder', 'Decoding');

    const logs = this.readLogs(fileName);

    const preparedLogs = await this.fileReader.prepareLogs(logs.logs);
    // TODO: if file contain json logs it shows error.
    await this.utils.promptMalformedLogDeletion();
    return preparedLogs;
  }

  private readLogs(fileName?: string): ILogsProto | ILogs {
    return this.fileReader.init(fileName);
  }
  /**
   * Decode file.
   * @description Decode targeted file.
   * @param fileName Target file.
   * @returns {void} Void.
   * @async
   */
  async saveDecoded(fileName?: string): Promise<void> {
    Log.debug('Time travel', 'Saving');

    const currName = this.fileController.fetchCurrentLogFile(fileName);

    const logs = await this.init(fileName);

    if (logs.length === 0) {
      return;
    }

    this.fileWriter.save(`decoded_${currName}`, logs);
  }
}
