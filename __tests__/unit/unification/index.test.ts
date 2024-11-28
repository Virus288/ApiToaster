import { afterEach, beforeAll, beforeEach, describe, it, expect } from '@jest/globals';
import express from 'express';
import fs from 'fs';
import defaultConfig from '../../../src/tools/config.js';
import State from '../../../src/tools/state.js';
import { IFullError } from '../../../types/error.js';
import FileWriter from '../../../src/module/files/writer.js';
import FileReader from '../../../src/module/files/reader.js';
import FileDecoder from '../../../src/module/decode/index.js';
import Unification from '../../../src/module/unification/index.js';
import Proto from '../../../src/module/protobuf/index.js'
import { INotFormattedLogEntry } from '../../../types/logs.js';

describe('Unification', () => {
  const clear = async (target?: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      fs.rmdir(target ?? 'Toaster', { recursive: true }, (_err) => {
        resolve(undefined);
      });
    });
  };
  const fileWriter = new FileWriter();
  const fileReader = new FileReader();
  const fileDecoder = new FileDecoder();
  const unification = new Unification();

  const defaultReq: Partial<express.Request> = {
    headers: {
      header: 'val',
    },
    ip: '127.0.0.2', // Don't dox me pls :(
    query: {
      key: 'value',
    },
    body: {},
  };
  beforeAll(() => {
    State.config = { ...defaultConfig(), ip: true };
  });

  beforeEach(async () => {
    await clear();
    State.config = { ...defaultConfig(), ip: true };
  });

  afterEach(async () => {
    await clear();
  });

  describe('Should pass', () => {
    it(`unification - add default method value`, async () => {
      let error: IFullError | undefined = undefined;
      let callback: [string, INotFormattedLogEntry][] = [];

      try {
        await fileWriter.init(defaultReq as express.Request);
        await unification.init('logs_0.json');
        fileReader.init('logs_0.json');
        callback = await fileDecoder.init('logs_0.json');
      } catch (err) {
        error = err as IFullError;
      }
      expect(error).toBeUndefined();
      expect(callback[0]![1]).toEqual({
        method: 'GET',
        headers: {
          header: 'val',
        },
        ip: '127.0.0.2',
        occured: expect.anything(),
        queryParams: {
          key: 'value',
        },
        body: {},
      });
    });

    it(`unification - add all default values`, async () => {
      let error: IFullError | undefined = undefined;
      let callback: [string, INotFormattedLogEntry][] = [];
      const newReq = structuredClone(defaultReq);
      delete newReq.headers;
      delete newReq.query;
      (newReq.ip as string)=""
      try {
        await fileWriter.init(newReq as express.Request);
        await unification.init('logs_0.json');
        fileReader.init('logs_0.json');
        callback = await fileDecoder.init('logs_0.json');
      } catch (err) {
        error = err as IFullError;
      }
      expect(error).toBeUndefined();
      const buff=fileWriter.prepareBuffedLog(callback[0]![1])
      const proto=new Proto()
      const enco=await proto.encodeLog(buff)
      console.log('00000000',await proto.decodeLogEntry(enco))
      expect(callback[0]![1]).toEqual({
        method: 'GET',
        headers: {},
        ip: '::ffff:127.0.0.1',
        occured: expect.anything(),
        queryParams: {},
        body: {},
      });
    });
  });
});
