import { beforeAll } from '@jest/globals';
import State from '../../src/tools/state.js'
import defaultConfig from '../../src/tools/config.js'

beforeAll(async () => {
  State.config = defaultConfig()
});
