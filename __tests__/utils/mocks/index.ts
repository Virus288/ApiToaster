import fs from 'fs'
import { jest } from '@jest/globals'
import FakeFs from '../fakes/fs'

export const mockFs = () => {
  jest.spyOn(fs, 'readdirSync').mockImplementation(FakeFs.readdirSync);
  jest.spyOn(fs, 'mkdirSync').mockImplementation(FakeFs.mkdirSync);
  jest.spyOn(fs, 'writeFileSync').mockImplementation(FakeFs.writeFileSync);
  jest.spyOn(fs, 'readFileSync').mockImplementation(FakeFs.readFileSync);
  jest.spyOn(fs, 'existsSync').mockImplementation(FakeFs.existsSync);
  jest.spyOn(fs, 'statSync').mockImplementation(FakeFs.statSync);
}

