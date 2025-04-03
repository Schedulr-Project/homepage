module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  setupFiles: ['<rootDir>/src/setupJest.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^axios$': require.resolve('axios'),
    '^jspdf$': '<rootDir>/src/__mocks__/jspdfMock.js',
    '^html2canvas$': '<rootDir>/src/__mocks__/html2canvasMock.js',
    '^src/components/Login': '<rootDir>/src/__mocks__/LoginMock.tsx',
    '^src/components/Dashboard': '<rootDir>/src/__mocks__/DashboardMock.tsx'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      useESM: true
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
        '@babel/preset-typescript'
      ]
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backend/'
  ]
}
