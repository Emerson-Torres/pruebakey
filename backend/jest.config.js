/** @type {import('jest').Config} */
module.exports = {
  // Usa ts-jest para poder ejecutar archivos .ts sin compilarlos antes
  preset: 'ts-jest',

  // Simula un entorno Node (no navegador) al correr los tests
  testEnvironment: 'node',

  // Jest busca archivos de test dentro de src/, con este patron de nombre
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',

  // Transforma cada .ts encontrado usando ts-jest antes de ejecutarlo
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Donde Jest calcula la cobertura de codigo (no exigimos un %, pero lo dejamos configurado)
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};