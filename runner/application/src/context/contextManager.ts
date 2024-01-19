import {
  ActionStepDefinition,
  ContextEnvironmentVariables,
  ContextSnapshot,
  StepResult,
  StepsResultSnapshot
} from '@pipeline/types';
import * as process from 'process';
import { SecretsManager } from '../secrets/secretsManager';
import { throwThis } from '@pipeline/utilities';
import { JobData } from '../types';

type Inputs = { [key: string]: string | number | boolean | undefined };

export class ContextManager {
  private readonly secretsManager: SecretsManager;
  private readonly environmentVariables: ContextEnvironmentVariables;
  private readonly inputs?: Inputs;
  private readonly jobData: JobData;
  private steps?: StepsResultSnapshot;

  private constructor({
    environmentVariables,
    ...rest
  }: {
    environmentVariables: ContextEnvironmentVariables;
    inputs?: Inputs;
    jobData: JobData;
  }) {
    this.environmentVariables = environmentVariables;
    ContextManager.updateProcessEnvironmentVariables(environmentVariables);
    this.jobData = rest.jobData
    this.secretsManager = SecretsManager.create(this.environmentVariables.RUNNER_SECRETS_DIRECTORY);

    this.inputs = { ...(rest.inputs || {}), ...(rest.jobData.inputs || {}) };
  }

  private static updateProcessEnvironmentVariables(
    environmentVariables: ContextEnvironmentVariables
  ) {
    Object.keys(environmentVariables).forEach((key) => {
      process.env[key] = environmentVariables[key];
    });
  }

  get contextSnapshot(): ContextSnapshot {
    return {
      env: this.environmentVariables,
      runner: {
        arch: process.arch,
        os: process.platform
      },
      secrets: this.secretsManager.retrieve(),
      internal: {
        event: this.jobData.event,
        eventName: this.jobData.event.type,
        ref: this.jobData.ref,
        refName: this.jobData.ref,
        repository: this.jobData.projectName,
        workspace: this.environmentVariables.RUNNER_WORKSPACE_DIRECTORY,
        // FIXME: This is incorrect URL
        projectUrl: this.environmentVariables.PIPELINE_GERRIT_URL,
        workflow: this.jobData.workflow,
        nexusUrl: this.environmentVariables.PIPELINE_NEXUS_URL,
        pipelinesDirectory: this.environmentVariables.RUNNER_PIPELINE_DIRECTORY,
        actionsDirectory: this.environmentVariables.RUNNER_ACTIONS_DIRECTORY,
        binariesDirectory: this.environmentVariables.RUNNER_BINARIES_DIRECTORY,
        job: this.environmentVariables.PIPELINE_JOB_NAME
      },
      ...{ inputs: this.inputs },
      ...{ steps: this.steps }
    } as any;
  }

  appendEnvironmentVariables(env: { [p: string]: string | undefined } | undefined) {
    Object.keys(env || {}).forEach((key) => {
      this.environmentVariables[key] = (env || {})[key];
    });

    ContextManager.updateProcessEnvironmentVariables(this.environmentVariables);
  }

  addEnv = (key: string, value: any) => {
    this.environmentVariables[key] = value;

    ContextManager.updateProcessEnvironmentVariables(this.environmentVariables);
  };

  addToPath = (path: string) => {
    this.environmentVariables['PATH'] = `${path}:${this.environmentVariables['PATH']}`;

    ContextManager.updateProcessEnvironmentVariables(this.environmentVariables);
  };

  public forComposite(step: ActionStepDefinition<any>) {
    return new ContextManager({
      environmentVariables: ContextManager.clone(this.environmentVariables),
      inputs: step.with,
      jobData: this.jobData
    });
  }

  public static forWorkflow(opts: { environmentVariables: ContextEnvironmentVariables, jobData: JobData }) {
    return new ContextManager(opts);
  }

  private static clone = (v) => JSON.parse(JSON.stringify(v));

  setResult(id: string | undefined, stepResult: StepResult) {
    this.steps = this.steps || {};
    this.steps[id ?? throwThis('ID for a step must be set')] = stepResult;
  }
}
