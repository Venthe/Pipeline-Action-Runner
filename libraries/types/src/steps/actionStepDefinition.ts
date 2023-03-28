import { StepDefinition } from './stepDefinition';

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ActionStepDefinition<T extends object = {}> extends StepDefinition {
  uses: string;
  with?: T;
}
