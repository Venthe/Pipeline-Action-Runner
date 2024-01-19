export type ContextEnvironmentVariables = RunnerEnvironmentVariables & PipelineEnvironmentVariables & SystemEnvironmentVariables;

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
}

export interface PipelineEnvironmentVariables {
  [key: string]: string | undefined;

  PIPELINE_DEBUG?: string;
  PIPELINE_JOB_NAME: string;
  PIPELINE_BUILD_ID: string;
  PIPELINE_WORKFLOW: string;
  PIPELINE_NEXUS_URL: string;
  PIPELINE_GERRIT_URL: string;
  PIPELINE_DOCKER_URL: string;
}
