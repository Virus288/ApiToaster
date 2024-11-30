import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import fs from 'fs';
import FileWriter from '../../../src/module/files/writer.js';
import TimeTravel from '../../../src/module/timeTravel/index.js';
import defaultConfig from '../../../src/tools/config.js';
import State from '../../../src/tools/state.js';
import { IFullError } from '../../../types/error.js';

describe('Time Travel', () => {
  let fetchMock: unknown;
  const clear = async (target?: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      fs.rmdir(target ?? 'Toaster', { recursive: true }, (_err) => {
        resolve(undefined);
      });
    });
  };

  const timeTravel = new TimeTravel();
  const fileWriter = new FileWriter();
  const defaultReq: Partial<express.Request> = {
    method: 'POST',
    headers: {
      header: 'val',
    },
    ip: '127.0.0.1', // Don't dox me pls :(
    query: {
      key: 'value',
    },
    body: {},
  };

  beforeAll(() => {
    State.config = { ...defaultConfig(), ip: true };
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => {},
      } as Response),
    );
  });

  beforeEach(async () => {
    await clear();
    State.config = defaultConfig();
  });

  afterEach(async () => {
    await clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // describe('Should throw', () => {
  //describe('No data passed', () => {});
  //describe('Incorrect data', () => {});
  // });

  describe('Should pass', () => {
    it(`init - sends requests`, async () => {
      let error: IFullError | undefined = undefined;
      let callback: unknown | undefined;
      try {
        await fileWriter.init(defaultReq as express.Request);
        callback = await timeTravel.init({ port: 0 });
      } catch (err) {
        error = err as IFullError;
      }
      expect(error).toBeUndefined();
      expect(callback).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(`http://localhost:0`, {
        method: 'POST',
        headers: {
          'X-Toaster': 'true',
          header: 'val',
        },
        body: '{}',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it(`init - no request to be send`, async () => {
      let error: IFullError | undefined = undefined;
      let callback: unknown | undefined;
      try {
        callback = await timeTravel.init({ port: 0 });
      } catch (err) {
        error = err as IFullError;
      }
      expect(error).toBeUndefined();
      expect(callback).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });
  });
});
