import {
  ActionStepDefinition,
  CompositeActionDefinition,
  ContextSnapshot,
  DockerStepDefinition,
  JobOutput,
  JobStatus,
  ShellStepDefinition,
  StepResult
} from '@pipeline/types';
import { ContextManager } from '../context/contextManager';
import { StepFactory } from './stepFactory';
import { error as _error, forceRun, running, step } from '@pipeline/utilities';
import { rerenderTemplate } from '../utilities/template';
import { exceptionMapper } from '../utilities';
import { ActionResult } from './actions';
import { shouldRunExpression } from './script';
import { debug, error, info } from '../utilities/log';
import { updateStepStatus } from '../utilities/orchestrator';

type OutputMappings = {
  // ${{ steps.step1.outputs.test }}
  [output: string]: string;
};

export type StepRunnerResult = {
  result: JobStatus;
  outputs?: JobOutput;
};

export class StepRunner {
  readonly managerName: string;
  private steps: (ActionStepDefinition | ShellStepDefinition)[] = [];
  private readonly contextManager: ContextManager;
  private readonly progressCallback?: (contextSnapshot: ContextSnapshot, status: JobStatus) => Promise<void>
  private readonly outputs?: OutputMappings;

  public forCompositeStep(
    step: ActionStepDefinition<any>,
    compositeStep: CompositeActionDefinition
  ): StepRunner {
    const outputs = Object.keys(compositeStep.outputs ?? {}).reduce((acc, key) => {
      acc[key] = (compositeStep?.outputs || {})[key].value;
      return acc;
    }, {} as OutputMappings);
    debug(`[Creating new StepRunner]\n
      ${JSON.stringify(step, undefined, 2)}\n
      ${JSON.stringify(compositeStep, undefined, 2)}\n
      ${JSON.stringify(outputs, undefined, 2)}`);

    const stepRunner = new StepRunner({
      stepDefinitions: compositeStep.runs.steps,
      contextManager: this.contextManager.forComposite(step),
      managerName: `${this.managerName}|${compositeStep.name}`,
      outputs
    });
    return stepRunner;
  }

  public static forJob(contextManager: ContextManager, progressCallback?: (contextSnapshot: ContextSnapshot, status: JobStatus) => Promise<void>): StepRunner {
    return new StepRunner({
      stepDefinitions: contextManager.stepsDefinitions,
      contextManager: contextManager,
      managerName: contextManager.contextSnapshot.internal.job,
      outputs: contextManager.outcomes,
      progressCallback
    });
  }

  constructor(props: {
    stepDefinitions: (ActionStepDefinition | ShellStepDefinition)[];
    contextManager: ContextManager;
    managerName: string;
    outputs?: OutputMappings;
    progressCallback?: (contextSnapshot: ContextSnapshot, status: JobStatus) => Promise<void>
  }) {
    this.managerName = props.managerName;
    this.steps = props.stepDefinitions;
    this.contextManager = props.contextManager;
    this.outputs = props.outputs;
  }

  public async run(): Promise<StepRunnerResult> {
    try {
      for (let index = 0; index < this.steps.length; index++) {
        const mappedStep = StepFactory.from(this.steps[index], index);

        await this.progressCallback?.(this.contextManager.contextSnapshot, 'in_progress');

        if (!this.isAnyStepConclusionFailure() || this.shouldRunFromScript(mappedStep)) {
          const result: ActionResult = await mappedStep.run(this, this.contextManager);
          // FIXME: Name added for convenience
          const res: StepResult = {
            ...result,
            conclusion: result.outcome,
            name: mappedStep.name
          } as StepResult;
          this.contextManager.setResult(mappedStep.id, res);
        } else {
          // FIXME: Name added for convenience
          this.contextManager.setResult(mappedStep.id, {
            outcome: 'skipped',
            conclusion: 'skipped',
            name: mappedStep.name
          } as StepResult);
        }

        await this.progressCallback?.(this.contextManager.contextSnapshot, this.contextManager.getResult(mappedStep.id).outcome);
      }

      const outputs = rerenderTemplate<JobOutput>(this.outputs ?? {}, this.contextManager.contextSnapshot);
      return this.isAnyStepConclusionFailure()
        ? { result: 'failure' }
        : {
          result: 'success',
          outputs: outputs
        };
    } catch (e: any) {
      error(exceptionMapper(e));
      return { result: 'failure' };
    }
  }

  private stateSuffix(mappedStep): string {
    if (this.isAnyStepConclusionFailure() && !this.shouldRunFromScript(mappedStep)) {
      return forceRun('Skipped'.toUpperCase());
    }
    if (this.isAnyStepConclusionFailure()) {
      return _error('Force run'.toUpperCase());
    }

    return running('Running'.toUpperCase());
  }

  private shouldRunFromScript(mappedStep) {
    if (!mappedStep.if) {
      return false;
    }

    return shouldRunExpression(this.contextManager.contextSnapshot, mappedStep.if);
  }

  private isAnyStepConclusionFailure() {
    const steps = this.contextManager.contextSnapshot?.steps || {};
    return !!Object.keys(steps)
      .map((key) => steps[key])
      .map((a) => a.outcome)
      .filter((a) => a.toLocaleLowerCase().includes('failure'))[0];
  }
}
