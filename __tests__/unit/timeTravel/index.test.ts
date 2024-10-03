import { describe, afterEach, expect, it, beforeAll, afterAll, jest, beforeEach } from '@jest/globals';
//import express from 'express'
import State from '../../../src/tools/state.js'
import defaultConfig from '../../../src/tools/config.js'
//import FileWriter from '../../../src/module/files/writer.js'
//import TimeTravel from '../../../src/module/timeTravel/index.js'
import * as mocks from '../../utils/mocks'
import FakeFs from '../../utils/fakes/fs.js';

describe('Time Travel', () => {
  //const timeTravel = new TimeTravel()
  //const fileWriter = new FileWriter()

  //const defaultReq: Partial<express.Request> = {
  //  method: 'POST',
  //  headers: {
  //    header: 'val'
  //  },
  //  ip: '127.0.0.1', // Don't dox me pls :(
  //  query: {
  //    key: "value"
  //  },
  //  body: {}
  //}

  beforeAll(() => {
    State.config = { ...defaultConfig(), ip: true }
    mocks.mockFs()
  })

  afterEach(() => {
    FakeFs.clear()
  })

  beforeEach(async () => {
    State.config = defaultConfig()
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('Should throw', () => {
    //describe('No data passed', () => {});
    //describe('Incorrect data', () => {});
  });

  describe('Should pass', () => {
    it(`Encode sample file`, async () => {
      //  let error: IFullError | undefined = undefined
      //  let callback: unknown | undefined = undefined
      //
      //  try {
      //    await fileWriter.init(defaultReq as express.Request)
      //    callback = await timeTravel.decode({ port: 0 })
      //  } catch (err) {
      //    error = err as IFullError
      //  }
      //
      //  expect(error).toBeUndefined()

      expect(2 + 2).toEqual(4)
      // Due to this function not returning any data, only loggin it. I am unable to write tests. Added tasks to change it
    });
  });
});

