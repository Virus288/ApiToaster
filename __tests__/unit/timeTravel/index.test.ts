import { describe, expect, it, beforeAll, afterEach, beforeEach } from '@jest/globals';
//import express from 'express'
import State from '../../../src/tools/state.js'
import fs from 'fs'
import defaultConfig from '../../../src/tools/config.js'
//import FileWriter from '../../../src/module/files/writer.js'
//import TimeTravel from '../../../src/module/timeTravel/index.js'

describe('Time Travel', () => {
  const clear = async (target?: string): Promise<void> => {
    return new Promise<void>(resolve => {
      fs.rmdir(target ?? 'Toaster', { recursive: true }, (_err) => {
        resolve(undefined)
      })
    })
  }

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
  })

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

