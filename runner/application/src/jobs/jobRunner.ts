import {
  JobStatus,
  JobOutput
} from '@pipeline/types';
import { ContextManager } from '../context/contextManager';
import { subtitle } from '@pipeline/utilities';
import { StepRunner } from '../steps/stepRunner';
import { info } from '../utilities/log';
import { updateJobStatus } from '../utilities/orchestrator';

export interface SingleJobResult {
  result: JobStatus;
  outputs?: JobOutput;
}

export class JobRunner {
  private readonly stepRunner: StepRunner;

  constructor(
    private readonly contextManager: ContextManager
  ) {
    this.stepRunner = StepRunner.forJob(contextManager);
  }

  async run(): Promise<SingleJobResult> {
    info(subtitle(`Running job ${this.contextManager.contextSnapshot.internal.job}`));
    await updateJobStatus(this.contextManager.contextSnapshot, 'in_progress')
    const outcome = await this.stepRunner.run();

    await updateJobStatus(this.contextManager.contextSnapshot, outcome.result, outcome.outputs)
    return outcome;
  }
}
