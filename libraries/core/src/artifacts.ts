import { password, shell } from '@pipeline/process';
import { ContextSnapshot, SecretsSnapshot } from '@pipeline/types';

export enum RepositoryType {
  User,
  System
}

function nexusBasicAuth(secrets: SecretsSnapshot) {
  return `${secrets.NEXUS_USERNAME}:${secrets.NEXUS_PASSWORD}`;
}

type DownloadParameters = {
  sourcePath: string;
  targetPath: string;
  type?: RepositoryType;
  context: ContextSnapshot;
};
type UploadParameters = {
  sourcePath: string;
  targetPath?: string;
  type?: RepositoryType;
  context: ContextSnapshot;
};

const curlPasswordMask = () => ({ mask: [password('--user')] });

interface Options {
  silent?: boolean;
  hack?: boolean;
}

export const download = async (
  { sourcePath, targetPath, context, type = RepositoryType.User }: DownloadParameters,
  { silent = false }: Options = {}
) => {
  if (context.env.PIPELINE_FILE_STORAGE_TYPE !== 'nexus') {
    throw new Error()
  }

  const nexusPath = pathStrategy(context, sourcePath, type);
  const url = `${context.internal.nexusUrl}/${nexusPath}`;
  if (!silent) {
    console.debug('Downloading artifact', nexusPath, 'to', targetPath);
  }
  return shell(
    `curl ${silent ? '--silent' : ''} --no-progress-meter --fail --user ${nexusBasicAuth(
      context.secrets
    )} ${url} --output ${targetPath}`,
    { silent, ...curlPasswordMask() }
  );
};

export const upload = async (
  { sourcePath, targetPath, context, type = RepositoryType.User }: UploadParameters,
  { silent = false }: Options = {}
) => {
  if (context.env.PIPELINE_FILE_STORAGE_TYPE !== 'nexus') {
    throw new Error()
  }

  const nexusPath = pathStrategy(context, targetPath ?? sourcePath, type);
  const url = `${context.internal.nexusUrl}/${nexusPath}`;
  if (!silent) {
    console.debug('Uploading artifact', sourcePath, 'to', nexusPath);
  }
  return shell(
    `curl ${silent ? '--silent' : ''} --no-progress-meter --fail --user ${nexusBasicAuth(
      context.secrets
    )} --upload-file "${sourcePath}" "${url}"`,
    { silent, ...curlPasswordMask() }
  );
};

const pathStrategy = (context: ContextSnapshot, sourcePath, type?: RepositoryType) => {
  const event: any = context.internal.event;
  if (!event.metadata?.pojectName || !event.metadata?.branchName) {
    // FIXME: Strongly type generic event
    throw new Error()
  }
  // FIXME: Use data from the context
  return type === RepositoryType.User
    ? `${['pipeline', event.metadata.projectName, event.metadata.branchName, sourcePath].join('/')}`
    : `${sourcePath}`;
};
