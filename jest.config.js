/* eslint-env node */

module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      packageJson: 'package.json',
      tsConfig: 'tsconfig.test.json',
    },
  },
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist', 'types'],
  testRegex: '((\\.|/)(test|spec))\\.[jt]sx?$'
}
