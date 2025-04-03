module.exports = {
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  testMatch: [
    '**/backend/**/*.test.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/scripts/'
  ]
}
