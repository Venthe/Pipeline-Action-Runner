import * as process from 'process';
import { PipelineEnvironmentVariables, SystemEnvironmentVariables } from '@pipeline/types';
import { exceptionMapper } from './utilities';
import { error } from '@pipeline/core';
import { loadJobData, setup } from './utilities/setup';
import { updateJobStatusInternal } from './utilities/orchestrator';
import { SecretsManager } from './secrets/secretsManager';
import { prepareDefaultEnvironmentVariables } from './configuration/environment';
import { ContextManager } from './context/contextManager';
import { JobRunner } from './jobs/jobRunner';

export const main = async () => {
  const env = { ...process.env as (PipelineEnvironmentVariables & SystemEnvironmentVariables), ...prepareDefaultEnvironmentVariables() };
  try {
    await setup(env);
    const jobData = await loadJobData(env);
    const secretsManager = SecretsManager.create(env.RUNNER_SECRETS_DIRECTORY);
    const contextManager = ContextManager.forWorkflow({ environmentVariables: env, jobData, secretsManager });

    const result = await new JobRunner(contextManager).run()

    if (result.result === 'failure') {
      process.exit(1);
    }
  } catch (exception: any) {
    error(`Unhandled fatal exception: ${exceptionMapper(exception)}`);
    updateJobStatusInternal(env.PIPELINE_ORCHESTRATOR_URL, env.PIPELINE_WORKFLOW_EXECUTION_ID, env.PIPELINE_JOB_NAME, 'failure')
    throw exception instanceof Error ? exception : new Error(JSON.stringify(exception));
  }
};
