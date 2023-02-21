const { defaults } = require('jest-config');

/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  ...defaults,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // Allows you to use a custom runner instead of Jest's default test runner
  runner: "jest-runner",

  // A list of paths to modules that run some code to configure or set up the testing framework after each test
  setupFilesAfterEnv: [
    "jest-mock-console/dist/setupTestFramework.js"
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "/.*/test.js",
    "/node_modules/",
    "/.history/",
  ],

  // Default timeout of a test in milliseconds.
  testTimeout: 3000,

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};

module.exports = config;
