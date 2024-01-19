import * as process from 'process';
import { WorkflowOrchestrator } from './workflow/workflowOrchestrator';
import { exceptionMapper, saveObjectAsFile } from './utilities';
import { error } from '@pipeline/core';
import { ContextEnvironmentVariables } from '@pipeline/types';
import { loadJobData, setup } from './utilities/setup';
import { SecretsManager } from './secrets/secretsManager';

export const main = async () => {
  try {
    const env = process.env as ContextEnvironmentVariables;

    await setup(env);
    const jobData = await loadJobData(env);
    const secretsManager = SecretsManager.create(env.RUNNER_SECRETS_DIRECTORY);
    const workflowOrchestrator = await WorkflowOrchestrator.create(env, jobData, secretsManager);

    const result = await workflowOrchestrator.run();

    saveObjectAsFile('/runner/result.json', result);
    if (result.result === 'failure') {
      process.exit(1);
    }
  } catch (exception: any) {
    error(`Unhandled fatal exception: ${exceptionMapper(exception)}`);
    throw exception instanceof Error ? exception : new Error(JSON.stringify(exception));
  }
};
