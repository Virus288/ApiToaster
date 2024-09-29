import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'lib/src/index.js',
  output: {
    file: 'lib/src/commonIndex.cjs',
    format: 'cjs'
  },
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs()
  ]
};

