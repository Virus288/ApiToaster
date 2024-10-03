import { beforeAll, afterEach, afterAll, jest, describe, expect, it } from '@jest/globals';
import fs from 'fs'
import FileReader from '../../../src/module/files/reader.js'
import State from '../../../src/tools/state.js'
import defaultConfig from '../../../src/tools/config.js'
import { IFullError } from '../../../types/error.js';
import { MalformedLogFilesError, NoSavedLogsError } from '../../../src/errors/index.js';
import path from 'path';
import * as mocks from '../../utils/mocks'
import FakeFs from '../../utils/fakes/fs.js';

describe('File reader', () => {
  const fileReader = new FileReader()

  beforeAll(async () => {
    State.config = defaultConfig()
    mocks.mockFs()
  });

  afterEach(() => {
    FakeFs.clear()
  })

  afterAll(async () => {
    jest.clearAllMocks()
  })

  describe('Should throw', () => {
    describe('No data passed', () => {
      it(`Read file - no files provided, files do not exist`, async () => {
        let err: IFullError | undefined = undefined

        try {
          fileReader.init()
        } catch (error) {
          err = error as IFullError
        }

        expect(err?.message).toEqual(new NoSavedLogsError().message)
      });

      it(`Read file - no files provided, default file is malformed`, async () => {
        let err: IFullError | undefined = undefined

        try {
          fs.mkdirSync('Toaster')
          fs.writeFileSync(path.resolve('Toaster', 'logs_0.json'), "test")
          fileReader.init()
        } catch (error) {
          err = error as IFullError
        }

        expect(err?.message).toEqual(new MalformedLogFilesError('logs_0.json').message)
      });
    });

    describe('Incorrect data', () => {
      it(`Read file, files do not exist`, async () => {
        let err: IFullError | undefined = undefined

        try {
          fileReader.init('logs_12312312.json')
        } catch (error) {
          err = error as IFullError
        }

        expect(err?.message).toEqual(new NoSavedLogsError().message)
      });

      it(`Read file, default file is malformed`, async () => {
        let err: IFullError | undefined = undefined

        try {
          fs.mkdirSync('Toaster')
          fs.writeFileSync(path.resolve('Toaster', 'logs_12312312.json'), "test")
          fileReader.init('logs_12312312.json')
        } catch (error) {
          err = error as IFullError
        }

        expect(err?.message).toEqual(new MalformedLogFilesError('logs_12312312.json').message)
      });
    });
  });

  describe('Should pass', () => {
    it(`Read file - no file provided`, async () => {
      fs.mkdirSync('Toaster')
      fs.writeFileSync(path.resolve('Toaster', 'logs_0.json'), JSON.stringify({ logs: { 'randomId': 213123 } }))

      const logs = fileReader.init()

      expect(logs).toEqual({ logs: { 'randomId': 213123 } })
    });

    it(`Read file - no file provided`, async () => {
      fs.mkdirSync('Toaster')
      fs.writeFileSync(path.resolve('Toaster', 'logs_123.json'), JSON.stringify({ logs: { 'randomId': 213123 } }))

      const logs = fileReader.init('logs_123.json')

      expect(logs).toEqual({ logs: { 'randomId': 213123 } })
    });
  });
});
