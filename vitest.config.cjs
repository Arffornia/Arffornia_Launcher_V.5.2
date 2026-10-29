// Unit tests run in Node, offline. See test/unit/.
const { defineConfig } = require('vitest/config')
const { resolve } = require('path')

module.exports = defineConfig({
  test: {
    include: ['test/unit/**/*.test.js'],
    environment: 'node',
    restoreMocks: true
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@': resolve(__dirname, 'src')
    }
  }
})
