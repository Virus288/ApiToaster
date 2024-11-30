import type { JestConfigWithTsJest } from 'ts-jest';
import unitConfig from './jest.config.unit';

const config: JestConfigWithTsJest = {
  ...unitConfig,
  bail: true,
};

export default config;
