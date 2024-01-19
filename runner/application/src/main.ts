import * as process from 'process';
import { WorkflowOrchestrator } from './workflow/workflowOrchestrator';
import { exceptionMapper, saveObjectAsFile } from './utilities';
import { error } from '@pipeline/core';
import { ContextEnvironmentVariables } from '@pipeline/types';
import { setup } from './utilities/setup';

export const main = async () => {
  try {
    const env = process.env as ContextEnvironmentVariables;

    await setup(env);
    const workflowOrchestrator = await WorkflowOrchestrator.create(env);
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
