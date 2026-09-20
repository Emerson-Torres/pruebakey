// Configuracion de ESLint para el backend (NestJS + TypeScript).
// Formato flat config (ESLint 9+).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignora carpetas generadas.
  {
    ignores: ['dist', 'node_modules', 'src/generated'],
  },
  // Reglas base de JS y TypeScript.
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Integracion con Prettier (debe ir al final para que gane).
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  eslintConfigPrettier,
);