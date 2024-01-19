import { ContextEnvironmentVariables, ContextSnapshot, Workflow } from '@pipeline/types';
import { JobRunner, SingleJobResult } from '../jobs/jobRunner';
import { ContextManager } from '../context/contextManager';
import { loadYamlFile, normalizeEvent } from '../utilities';
import { shellMany } from '@pipeline/process';
import { title } from '@pipeline/utilities';
import { checkoutCommands, info } from '@pipeline/core';
import { prepareDefaultEnvironmentVariables } from '../configuration/environment';
import { renderTemplate } from '../utilities/template';
import { JobData } from '../types';
import { SecretsManager } from '../secrets/secretsManager';

export class WorkflowOrchestrator {
  private readonly contextManager: ContextManager;

  private workflow: Workflow | undefined;
  private jobRunner: JobRunner | undefined;

  public static async create(env: ContextEnvironmentVariables, jobData: JobData, secretsManager: SecretsManager) {
    const workflowOrchestrator = new WorkflowOrchestrator(env, jobData, secretsManager);
    await workflowOrchestrator.postConstruct();
    return workflowOrchestrator;
  }

  private constructor(readonly env: ContextEnvironmentVariables, readonly jobData: JobData, readonly secretsManager: SecretsManager) {
    this.contextManager = ContextManager.forWorkflow({
      environmentVariables: { ...env, ...prepareDefaultEnvironmentVariables() },
      jobData,
      secretsManager
    });
  }

  private async postConstruct() {
    await WorkflowOrchestrator.downloadPipelines(this.contextManager.contextSnapshot);
    this.workflow = WorkflowOrchestrator.loadWorkflow(this.contextManager.contextSnapshot);
    this.contextManager.appendEnvironmentVariables(this.workflow.env);

    info(title(`Initializing workflow`));
    info(` Workflow name: ${this.workflow.name}`);
    info(` Workflow run name: ${this.workflowRunName}`);

    this.jobRunner = this.prepareJobRunner(
      this.contextManager.contextSnapshot.internal.job,
      this.contextManager
    );
  }

  private static async downloadPipelines(contextSnapshot: ContextSnapshot) {
    // FIXME: Strongly type event
    const projectUrl = `${contextSnapshot.internal.projectUrl}/${(contextSnapshot.internal.event as any).metadata.projectName}`;
    await shellMany(
      checkoutCommands({
        repository: projectUrl,
        // FIXME: Strongly type event
        revision: (contextSnapshot.internal.event as any).metadata.revision,
        options: {
          // FIXME: Strongly type event
          branchName: (contextSnapshot.internal.event as any).metadata.branchName,
          depth: 1,
          quiet: false,
          sparseCheckout: ['.pipeline/']
        }
      }),
      { cwd: contextSnapshot.internal.pipelinesDirectory }
    );
  }

  private static loadWorkflow = (contextSnapshot: ContextSnapshot) =>
    loadYamlFile<Workflow>(
      `${contextSnapshot.internal.pipelinesDirectory}/.pipeline/workflows/${contextSnapshot.internal.workflow}`
    );

  get workflowRunName() {
    const contextSnapshot = this.contextManager.contextSnapshot;
    if (this.workflow?.runName) {
      return renderTemplate(this.workflow.runName, contextSnapshot);
    } else {
      switch (normalizeEvent(contextSnapshot.internal.eventName)) {
        case normalizeEvent('patchset-created'):
        case normalizeEvent('change-merged'):
          // FIXME: Strongly type event
          return (contextSnapshot.internal.event as any).additionalProperties.commit.subject;
        default:
          return normalizeEvent(contextSnapshot.internal.eventName);
      }
    }
  }

  private prepareJobRunner = (jobName: string, contextManager: ContextManager) => {
    if (!this.workflow) {
      throw new Error('Workflow should exist!');
    }
    return new JobRunner(this.workflow.jobs[jobName], contextManager);
  };

  public async run(): Promise<SingleJobResult> {
    if (!this.jobRunner) {
      throw new Error('Job runner should exist!');
    }
    return await this.jobRunner.run();
  }
}
