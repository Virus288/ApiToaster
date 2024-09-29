import { beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import path from 'path'
import express from 'express'
import fs from 'fs'
import FileReader from '../../../src/module/files/reader.js'
import FileWriter from '../../../src/module/files/writer.js'
import State from '../../../src/tools/state.js'
import defaultConfig from '../../../src/tools/config.js'
import { ILogsProto } from '../../../types/logs.js';
import { IFullError } from '../../../types/error.js';

// Small note
// #TODO Those tests should run mocked fs modules. Due to jest not beeing able to mock built-in modules in esm mode, its impossible to do this ( or I just do not know how ). Fix it asap

describe('File writer', () => {
  const clear = async (target?: string): Promise<void> => {
    return new Promise<void>(resolve => {
      fs.rmdir(target ?? 'Toaster', { recursive: true }, (_err) => {
        resolve(undefined)
      })
    })
  }

  const defaultReq: Partial<express.Request> = {
    method: 'POST',
    headers: {
      header: 'val'
    },
    ip: '127.0.0.1', // Don't dox me pls :(
    query: {
      key: "value"
    },
    body: {}
  }

  const fileWriter = new FileWriter()
  const fileReader = new FileReader()

  beforeEach(async () => {
    State.config = defaultConfig()
    await clear()
  })

  afterEach(async () => {
    await clear()
  })

  describe('Should throw', () => {
    //describe('No data passed', () => {});

    //describe('Incorrect data', () => {});
  });

  describe('Should pass', () => {
    it(`Write file - buffed, default config`, async () => {
      let error: IFullError | undefined = undefined
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()
      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, different path in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, path: path.join(process.cwd(), 'AnotherToaster') }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()
        fs.readdirSync(path.join(process.cwd(), 'AnotherToaster'))
        await clear("AnotherToaster")
      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, do not log method in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, method: false }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()

      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, do not log body in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, body: false }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()

      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, do not log queryParams in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, queryParams: false }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()

      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, do not log headers in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, headers: false }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()

      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, do log ip in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, ip: true }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()

      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });

    it(`Write file - buffed, do not obfuscate anything in config`, async () => {
      let error: IFullError | undefined = undefined
      State.config = { ...State.config, obfuscate: [] }
      let callback: ILogsProto | undefined = undefined

      try {
        await fileWriter.init(defaultReq as express.Request)
        callback = fileReader.init()

      } catch (err) {
        error = err as IFullError
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1)
      expect(error).toBeUndefined()
    });
  });
});

