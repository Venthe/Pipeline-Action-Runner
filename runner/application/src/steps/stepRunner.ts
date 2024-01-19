import {
  ActionStepDefinition,
  CompositeActionDefinition,
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
  private readonly outputs?: OutputMappings;
  private informAboutProgress: boolean = true;

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
    stepRunner.informAboutProgress = false
    return stepRunner;
  }

  public static forJob(steps: (DockerStepDefinition | ShellStepDefinition | ActionStepDefinition)[], outputs: OutputMappings, contextManager: ContextManager): StepRunner {
    return new StepRunner({
      stepDefinitions: steps,
      contextManager: contextManager,
      managerName: contextManager.contextSnapshot.internal.job,
      outputs: outputs
    });
  }

  constructor({
    stepDefinitions,
    contextManager,
    ...rest
  }: {
    stepDefinitions: (ActionStepDefinition | ShellStepDefinition)[];
    contextManager: ContextManager;
    managerName: string;
    outputs?: OutputMappings;
  }) {
    this.managerName = rest.managerName;
    this.steps = stepDefinitions;
    this.contextManager = contextManager;
    this.outputs = rest.outputs;
  }

  public async run(): Promise<StepRunnerResult> {
    try {
      for(let index = 0; index< this.steps.length; index++) {
        const mappedStep = StepFactory.from(this.steps[index], index);

        info(
          step(`[${mappedStep.id}][${this.managerName}]: ${mappedStep.name}`) +
          ` - ${this.stateSuffix(mappedStep)}`
        );

        if (this.informAboutProgress) { await updateStepStatus(this.contextManager.contextSnapshot, index, 'in_progress') }

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

        if (this.informAboutProgress) { await updateStepStatus(this.contextManager.contextSnapshot, index, this.contextManager.getResult(mappedStep.id).outcome) }

        info(`[Step finished] ${mappedStep.name} - ${this.contextManager.getResult(mappedStep.id).outcome}`)
        debug(
          `[Step finished] ${mappedStep.name}\nJSON.stringify(this.outputs, undefined, 2)\nJSON.stringify(this.contextManager.contextSnapshot.steps, undefined, 2)`
        );
      }

      const outputs = rerenderTemplate<JobOutput>(
        this.outputs ?? {},
        this.contextManager.contextSnapshot
      );
      debug(`[Runner finished] ${this.managerName}\n
        ${JSON.stringify(this.outputs, undefined, 2)}\n
        ${JSON.stringify(this.contextManager.contextSnapshot.steps, undefined, 2)}
      `);
      return this.isAnyStepConclusionFailure()
        ? { result: 'failure' }
        : {
            result: 'success',
            outputs: outputs
          };
    } catch (e: any) {
      error(exceptionMapper(e));
      return {
        result: 'failure'
      };
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
