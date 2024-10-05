import defaultConfig from './jest.config.default';

const config = {
  ...defaultConfig,
  roots: ['./unit'],
};

export default config;
