import { ActionStepDefinition } from '@pipeline/types';
import { StepRunner } from './stepRunner';
import { ContextManager } from '../context/contextManager';
import { getId as gid, Step } from './step';
import { throwThis } from '@pipeline/utilities';
import { Action, ActionResult } from './actions';
import { rerenderTemplate } from '../utilities/template';

// eslint-disable-next-line @typescript-eslint/ban-types
export class ActionStep<T extends object = {}> implements Step<ActionStepDefinition<T>> {
  constructor(private readonly step: ActionStepDefinition<T>, private readonly index: number) {}

  get name(): string {
    const newVar = this.step.name ?? this.id;
    if (newVar === undefined) {
      throw new Error('Name cannot be set');
    }
    return newVar;
  }

  async run(parentStepRunner: StepRunner, contextManager: ContextManager): Promise<ActionResult> {
    try {
      const stepDefinition = {
        ...this.step,
        ...(this.step.with
          ? { with: rerenderTemplate(this.step.with ?? {}, contextManager.contextSnapshot) }
          : {})
      };
      const action = await Action.load(stepDefinition, contextManager, parentStepRunner);
      return action.run();
    } catch (e) {
      return { outcome: 'failure' };
    }
  }

  get uses(): string {
    return (
      this.step.uses ??
      throwThis(
        "No action found for step definition. Step definition 'uses' field should not be null"
      )
    );
  }

  get id(): string {
    return gid(this.step, this.index);
  }

  get if(): string | undefined {
    return this.step.if;
  }
}
