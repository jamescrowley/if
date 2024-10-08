import {z} from 'zod';
import {ERRORS} from '@grnsft/if-core/utils';
import {
  ExecutePlugin,
  PluginParametersMetadata,
  PluginParams,
} from '@grnsft/if-core/types';

import {validate} from '../../../common/util/validations';

import {STRINGS} from '../../config';

const {MISSING_GLOBAL_CONFIG} = STRINGS;
const {GlobalConfigError} = ERRORS;
//   keep-existing: true/false (whether to remove the parameter you are copying from)
//   from-param: the parameter you are copying from (e.g. cpu/name)
//   to-field: the parameter you are copying to (e.g. cpu/processor-name)

export const Copy = (
  globalConfig: Record<string, any>,
  parametersMetadata: PluginParametersMetadata
): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
    inputs: parametersMetadata?.inputs,
    outputs: parametersMetadata?.outputs,
  };

  /**
   * Checks global config value are valid.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new GlobalConfigError(MISSING_GLOBAL_CONFIG);
    }

    const globalConfigSchema = z.object({
      'keep-existing': z.boolean(),
      from: z.string().min(1).or(z.number()),
      to: z.string().min(1),
    });

    return validate<z.infer<typeof globalConfigSchema>>(
      globalConfigSchema,
      globalConfig
    );
  };

  /**
   * Checks for required fields in input.
   */
  const validateSingleInput = (
    input: PluginParams,
    inputParameters: (string | number)[]
  ) => {
    const inputData = inputParameters.reduce(
      (acc, param) => {
        acc[param] = input[param];

        return acc;
      },
      {} as Record<string, string | number>
    );

    const validationSchema = z.record(z.string(), z.string().or(z.number()));

    validate(validationSchema, inputData);

    return input;
  };

  const execute = (inputs: PluginParams[]) => {
    const safeGlobalConfig = validateGlobalConfig();
    const keepExisting = safeGlobalConfig['keep-existing'] === true;
    const from = safeGlobalConfig['from'];
    const to = safeGlobalConfig['to'];

    return inputs.map(input => {
      const safeInput = validateSingleInput(input, [from]);

      const outputValue = safeInput[from];
      if (safeInput[from]) {
        if (!keepExisting) {
          delete safeInput[from];
        }
      }

      return {
        ...safeInput, // need to return or what you provide won't be outputted, don't be evil!
        [to]: outputValue,
      };
    });
  };

  return {
    metadata,
    execute,
  };
};
