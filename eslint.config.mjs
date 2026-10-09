import js from '@eslint/js';
import parser from '@typescript-eslint/parser';

export default [
  { ignores: ['.next/**', '.data/**', 'node_modules/**', 'src/payload-types.ts'] },
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { ...js.configs.recommended.rules, 'no-undef': 'off', 'no-unused-vars': 'off' },
  },
];
