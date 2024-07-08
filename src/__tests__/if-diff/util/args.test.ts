jest.mock('ts-command-line-args', () => ({
  __esModule: true,
  parse: () => {
    switch (process.env.result) {
      case 'only-target':
        return {
          target: 'target-mock.yml',
        };
      case 'target-is-not-yaml':
        return {
          target: 'target-mock',
        };
      case 'source-is-not-yaml':
        return {
          target: 'target-mock.yml',
          source: 'source-mock',
        };
      case 'target-source':
        return {
          target: 'target-mock.yml',
          source: 'source-mock.yml',
        };
      case 'diff-throw-error':
        throw new Error('mock-error');
      case 'diff-throw':
        throw 'mock-error';
      default:
        return {
          manifest: 'mock-manifest.yaml',
          output: 'mock-output',
        };
    }
  },
}));

import {ERRORS} from '@grnsft/if-core/utils';

import {parseIfDiffArgs} from '../../../if-diff/util/args';

import {STRINGS as COMMON_STRINGS} from '../../../common/config';
import {STRINGS} from '../../../if-diff/config';

const {ParseCliParamsError} = ERRORS;

const {TARGET_IS_NOT_YAML, SOURCE_IS_NOT_YAML} = COMMON_STRINGS;
const {INVALID_TARGET} = STRINGS;

describe('util/args: ', () => {
  const originalEnv = process.env;

  describe('parseIfDiffArgs(): ', () => {
    it('throws error if `target` is missing.', () => {
      expect.assertions(1);

      try {
        parseIfDiffArgs();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toEqual(new ParseCliParamsError(INVALID_TARGET));
        }
      }
    });

    it('throws error if `target` is not a yaml.', () => {
      process.env.result = 'target-is-not-yaml';
      expect.assertions(1);

      try {
        parseIfDiffArgs();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toEqual(new ParseCliParamsError(TARGET_IS_NOT_YAML));
        }
      }
    });

    it('returns `target`s full path.', () => {
      process.env.result = 'only-target';
      expect.assertions(1);

      const response = parseIfDiffArgs();
      expect(response).toHaveProperty('targetPath');
    });

    it('throws error if source is not a yaml.', () => {
      process.env.result = 'source-is-not-yaml';
      expect.assertions(1);

      try {
        parseIfDiffArgs();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toEqual(new ParseCliParamsError(SOURCE_IS_NOT_YAML));
        }
      }
    });

    it('returns target and source full paths.', () => {
      process.env.result = 'target-source';
      expect.assertions(2);

      const response = parseIfDiffArgs();
      expect(response).toHaveProperty('targetPath');
      expect(response).toHaveProperty('sourcePath');
    });

    it('throws error if parsing failed.', () => {
      process.env.result = 'diff-throw-error';
      expect.assertions(1);

      try {
        parseIfDiffArgs();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toEqual(new ParseCliParamsError('mock-error'));
        }
      }
    });

    it('throws error if parsing failed (not instance of error).', () => {
      process.env.result = 'diff-throw';
      expect.assertions(1);

      try {
        parseIfDiffArgs();
      } catch (error) {
        expect(error).toEqual('mock-error');
      }
    });
  });

  process.env = originalEnv;
});
