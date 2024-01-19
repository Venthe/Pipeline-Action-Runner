import { ContextEnvironmentVariables } from '@pipeline/types';
import { JobRunner, SingleJobResult } from '../jobs/jobRunner';
import { ContextManager } from '../context/contextManager';
import { JobData } from '../types';
import { SecretsManager } from '../secrets/secretsManager';

export class WorkflowOrchestrator {
  private jobRunner: JobRunner;

  public constructor(readonly env: ContextEnvironmentVariables, readonly jobData: JobData, readonly secretsManager: SecretsManager) {
    const contextManager = ContextManager.forWorkflow({
      environmentVariables: env,
      jobData,
      secretsManager
    });
    this.jobRunner = new JobRunner(contextManager);
  }

  public async run(): Promise<SingleJobResult> {
    if (!this.jobRunner) {
      throw new Error('Job runner should exist!');
    }
    return await this.jobRunner.run();
  }
}
