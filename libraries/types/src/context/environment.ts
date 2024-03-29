export type ContextEnvironmentVariables = RunnerEnvironmentVariables & PipelineEnvironmentVariables & SystemEnvironmentVariables & DebugEnvironmentVariables;

export interface RunnerEnvironmentVariables {
  [key: string]: string | undefined;

  RUNNER_CACHE_DIRECTORY: string;
  RUNNER_MANAGER_DIRECTORY: string;
  RUNNER_TEMP_DIRECTORY: string;
  RUNNER_METADATA_DIRECTORY: string;
  RUNNER_WORKSPACE_DIRECTORY: string;
  RUNNER_BINARIES_DIRECTORY: string;
  RUNNER_SECRETS_DIRECTORY: string;
  RUNNER_ENV_DIRECTORY: string;
  RUNNER_ACTIONS_DIRECTORY: string;
}

export interface SystemEnvironmentVariables {
  PIPELINE_FILE_STORAGE_TYPE: string
  PIPELINE_FILE_STORAGE_URL: string
  PIPELINE_VERSION_CONTROL_TYPE: string
  PIPELINE_VERSION_CONTROL_SSH_PORT: string
  PIPELINE_VERSION_CONTROL_SSH_HOST: string
  PIPELINE_VERSION_CONTROL_SSH_USERNAME: string
  PIPELINE_DOCKER_URL: string
  PIPELINE_ORCHESTRATOR_URL: string
}

export interface PipelineEnvironmentVariables {
  [key: string]: string | undefined;

  PIPELINE_DEBUG?: string;
  PIPELINE_WORKFLOW: string;
  PIPELINE_WORKFLOW_EXECUTION_ID: string
  PIPELINE_JOB_NAME: string;
  PIPELINE_BUILD_ID: string;
}

export interface DebugEnvironmentVariables {
  __DEBUG_SSH_PRIVATE_KEY?: string
  __DEBUG_JOB_DATA?: string
  __DEBUG_DONT_UPDATE_STATUS?: string
}
