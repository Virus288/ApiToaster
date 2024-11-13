import Log from '../../tools/logger.js';
import FileReader from '../files/reader.js';
import FileWriter from '../files/writer.js';
import type { ILogs, ILogsProto, INotFormattedLogEntry } from '../../../types';

export default class Decoder {
  private _fileWriter: FileWriter;
  private _fileReader: FileReader;

  constructor() {
    this._fileWriter = new FileWriter();
    this._fileReader = new FileReader();
  }

  private get fileWriter(): FileWriter {
    return this._fileWriter;
  }

  private get fileReader(): FileReader {
    return this._fileReader;
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

    return this.fileReader.prepareLogs(logs.logs);
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
    Log.debug('Decoder', 'Saving');

    const logs = await this.init(fileName);
    this.fileWriter.save(`decoded_${fileName}`, logs);
  }
}
