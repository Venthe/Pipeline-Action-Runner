import { ActionStepDefinition, DockerStepDefinition, ShellStepDefinition } from "@pipeline/types";

export type Inputs = { [key: string]: string | number | boolean | undefined };

export interface JobData {
  projectName: string
  ref: string
  workflow: string
  event: unknown & { type: string }
  env: { [key: string]: string | undefined }
  outputs: { [key: string]: string | undefined }
  steps: (DockerStepDefinition | ShellStepDefinition | ActionStepDefinition)[]
  timeoutMinutes: number
  continueOnError: boolean
  inputs: { [key: string]: string | undefined }
}