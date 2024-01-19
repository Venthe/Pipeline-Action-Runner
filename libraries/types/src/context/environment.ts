export type ContextEnvironmentVariables = RunnerEnvironmentVariables & PipelineEnvironmentVariables & SystemEnvironmentVariables & DebugEnvironmentVariables;

export interface RunnerEnvironmentVariables {
  [key: string]: string | undefined;

  RUNNER_CACHE_DIRECTORY: string;
  RUNNER_MANAGER_DIRECTORY: string;
  RUNNER_METADATA_DIRECTORY: string;
  RUNNER_WORKSPACE_DIRECTORY: string;
  RUNNER_BINARIES_DIRECTORY: string;
  RUNNER_SECRETS_DIRECTORY: string;
  RUNNER_ENV_DIRECTORY: string;
  RUNNER_ACTIONS_DIRECTORY: string;
  RUNNER_PIPELINE_DIRECTORY: string;
}

export interface SystemEnvironmentVariables {
  PIPELINE_FILE_STORAGE_TYPE: string
  PIPELINE_VERSION_CONTROL_TYPE: string
  PIPELINE_VERSION_CONTROL_SSH_PORT: string
  PIPELINE_VERSION_CONTROL_SSH_HOST: string
}

export interface PipelineEnvironmentVariables {
  [key: string]: string | undefined;

  PIPELINE_DEBUG?: string;
  PIPELINE_JOB_NAME: string;
  PIPELINE_BUILD_ID: string;
  PIPELINE_WORKFLOW: string;
}

export interface DebugEnvironmentVariables {
  __DEBUG_SSH_PRIVATE_KEY?: string
}
