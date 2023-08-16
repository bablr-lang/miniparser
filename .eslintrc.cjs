const fs = require('fs');
const { CachedInputFileSystem } = require('enhanced-resolve');

module.exports = {
  extends: ['plugin:import/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-undef': 'error',
    'no-fallthrough': 'error',
    'no-const-assign': 'error',
  },
  globals: {
    require: 'readonly',
    module: 'readonly',
    Map: 'readonly',
    Set: 'readonly',
    WeakMap: 'readonly',
    Symbol: 'readonly',
  },
  settings: {
    'import/resolver': {
      'enhanced-resolve': {
        fileSystem: new CachedInputFileSystem(fs, 4000),
        conditionNames: ['import'],
      },
    },
  },
};
