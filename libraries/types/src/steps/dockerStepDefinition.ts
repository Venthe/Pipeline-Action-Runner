import { ActionStepDefinition } from './actionStepDefinition';

export type DockerStepDefinition = ActionStepDefinition<{
    [key: string]: string | undefined;
    /** in docker **/
    entrypoint?: string;
  }>
