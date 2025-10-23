import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // 포맷
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // 문자열: 홑따옴표 우선, 이스케이프 필요 시 큰따옴표 허용
      quotes: ['error', 'single', { avoidEscape: true }],

      // console 허용: error, warn만
      'no-console': 'off',

      // 미사용 변수 무시 설정
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // 네이밍 컨벤션
      camelcase: 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'variable', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['camelCase'],
        },
      ],

      // 스타일 룰
      eqeqeq: 'error',
      semi: ['error', 'always'],
      'space-in-parens': ['error', 'never'],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'comma-spacing': ['error', { before: false, after: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],

      // 함수 스타일
      'prefer-arrow-callback': 'error',
      'func-style': ['error', 'expression'],
      '@typescript-eslint/prefer-function-type': 'error',

      // 기타 품질 규칙
      'object-shorthand': ['error', 'always'],
      'prefer-const': 'error',

      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  {
    // DTO/Validator/선언파일 네이밍 규칙 제외
    files: ['src/**/dto/**/*.ts', 'src/validators/**/*.ts', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  }
);
