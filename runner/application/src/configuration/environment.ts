import * as fs from 'fs';
import { loadEnvironmentFile } from '../utilities';
import { RunnerEnvironmentVariables } from '@pipeline/types'

export const prepareDefaultEnvironmentVariables = (): RunnerEnvironmentVariables => {
  const runnerEnvs: RunnerEnvironmentVariables = {
    RUNNER_CACHE_DIRECTORY: '/runner/cache',
    RUNNER_MANAGER_DIRECTORY: '/runner',
    RUNNER_PIPELINE_DIRECTORY: '/runner/pipeline',
    RUNNER_METADATA_DIRECTORY: '/runner/metadata',
    RUNNER_BINARIES_DIRECTORY: '/runner/bin',
    RUNNER_WORKSPACE_DIRECTORY: process.env.RUNNER_WORKSPACE_DIRECTORY ?? '/workdir',
    RUNNER_SECRETS_DIRECTORY: '/runner/metadata/secrets',
    RUNNER_ENV_DIRECTORY: '/runner/metadata/env',
    RUNNER_ACTIONS_DIRECTORY: '/runner/actions'
  };

  return {
    ...runnerEnvs,
    ...loadEnvFiles(runnerEnvs.RUNNER_ENV_DIRECTORY)
  };
};

function loadEnvFiles(envDirectory: string): { [key: string]: string | undefined } {
  const env: { [key: string]: string | undefined } = {};
  const files = fs.readdirSync(envDirectory);
  files.forEach((file) => {
    const parsedEnvironmentFile = loadEnvironmentFile(`${envDirectory}/${file}`);
    Object.keys(parsedEnvironmentFile).forEach((key) => {
      env[key] = parsedEnvironmentFile[key];
    });
  });

  return env;
}
