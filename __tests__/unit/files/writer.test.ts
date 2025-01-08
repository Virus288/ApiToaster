import { beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import path from 'path';
import express from 'express';
import FileReader from '../../../src/module/files/reader.js';
import FileWriter from '../../../src/module/files/writer.js';
import State from '../../../src/tools/state.js';
import defaultConfig from '../../../src/tools/config.js';
import { ILogs, ILogsProto, INotFormattedLogEntry } from '../../../types/logs.js';
import { IFullError } from '../../../types/error.js';
import fs from 'fs';

// Small note
// #TODO Those tests should run mocked fs modules. Due to jest Crashing with internal errors, this is like this.
describe('File writer', () => {
  const clear = async (target?: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      fs.rmdir(target ?? 'Toaster', { recursive: true }, (_err) => {
        resolve(undefined)
      })
    })
  }

  const defaultReq: Partial<express.Request> = {
    method: 'POST',
    headers: {
      header: 'val',
    },
    ip: '127.0.0.1', // Don't dox me pls :(
    query: {
      key: 'value',
    },
    body: { test: 'asd' },
  };

  const fileWriter = new FileWriter();
  const fileReader = new FileReader();

  beforeEach(async () => {
    State.config = defaultConfig();
    await clear()
    await clear('AnotherToaster')
  })

  afterEach(async () => {
    await clear()
    await clear('AnotherToaster')
  })

  describe('Should throw', () => {
    //describe('No data passed', () => {});
    //describe('Incorrect data', () => {});
  });

  describe('Should pass', () => {
    it(`Write file - buffed, default config`, async () => {
      let error: IFullError | undefined = undefined;
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    // Because we do not have an option to manipulate file size by hand, this is disabled. Test was manually started. Uncomment, after file size validation changes
    //it(`Write file - buffed, default config - save 2 entries to 2 different files and test index location`, async () => {
    //  let error: IFullError | undefined = undefined
    //  let callback: ILogsProto | ILogs | undefined = undefined
    //
    //  try {
    //    await fileWriter.init(defaultReq as express.Request)
    //    await fileWriter.init(defaultReq as express.Request)
    //    callback = fileReader.init()
    //  } catch (err) {
    //    error = err as IFullError
    //  }
    //
    //  expect(Object.keys(callback?.logs ?? {}).length).toEqual(2)
    //  expect(error).toBeUndefined()
    //});

    it(`Write file - buffed, different path in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, path: path.join(process.cwd(), 'AnotherToaster') };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
        fs.readdirSync(path.join(process.cwd(), 'AnotherToaster'));
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, do not log method in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, method: false };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, do not log body in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, body: false };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, do not log queryParams in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, queryParams: false };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, do not log headers in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, headers: false };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, do log ip in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, ip: true };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, do not obfuscate anything in config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, obfuscate: [] };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - buffed, default config`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config };
      let callback: ILogsProto | ILogs | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = fileReader.init();
      } catch (err) {
        error = err as IFullError;
      }

      expect(Object.keys(callback?.logs ?? {}).length).toEqual(1);
      expect(error).toBeUndefined();
    });

    it(`Write file - debuffed, disabled proto`, async () => {
      let error: IFullError | undefined = undefined;
      State.config = { ...State.config, disableProto: true };
      let callback: INotFormattedLogEntry | undefined = undefined;

      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = JSON.parse(Object.values((fileReader.init() as ILogsProto).logs)[0]!);
      } catch (err) {
        error = err as IFullError;
      }
      expect(callback?.body).toEqual(defaultReq.body);
      expect(callback?.method).toEqual(defaultReq.method);
      expect(callback?.headers).toEqual(defaultReq.headers);
      expect(callback?.queryParams).toEqual(defaultReq.query);
      expect(error).toBeUndefined();
    });

    // it(`Write file - debuffed, disabled statusCode`, async () => {
    //   let error: IFullError | undefined = undefined;
    //   State.config = { ...State.config, statusCode: false, disableProto: true };
    //   let callback: INotFormattedLogEntry | undefined = undefined;
    //
    //   try {
    //     await fileWriter.init(defaultReq as express.Request, 200);
    //     callback = JSON.parse(Object.values((fileReader.init() as ILogsProto).logs)[0]!);
    //   } catch (err) {
    //     error = err as IFullError;
    //   }
    //
    //   expect(callback?.body).toEqual(defaultReq.body);
    //   expect(callback?.method).toEqual(defaultReq.method);
    //   expect(callback?.headers).toEqual(defaultReq.headers);
    //   expect(callback?.queryParams).toEqual(defaultReq.query);
    //   expect(callback?.statusCode).toBeUndefined()
    //   expect(error).toBeUndefined();
    // });
    // it(`Write file - debuffed, enabled statusCode`, async () => {
    //   let error: IFullError | undefined = undefined;
    //   State.config = { ...State.config, disableProto: true };
    //   let callback: INotFormattedLogEntry | undefined = undefined;
    //
    //   try {
    //     await fileWriter.init(defaultReq as express.Request, 400);
    //     callback = JSON.parse(Object.values((fileReader.init() as ILogsProto).logs)[0]!);
    //   } catch (err) {
    //     error = err as IFullError;
    //   }
    //
    //   expect(callback?.body).toEqual(defaultReq.body);
    //   expect(callback?.method).toEqual(defaultReq.method);
    //   expect(callback?.headers).toEqual(defaultReq.headers);
    //   expect(callback?.queryParams).toEqual(defaultReq.query);
    //   expect(callback?.statusCode).toEqual(400)
    //   expect(error).toBeUndefined();
    // });
  });
});
