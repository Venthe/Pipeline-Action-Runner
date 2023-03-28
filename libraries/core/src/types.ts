/* eslint-disable @typescript-eslint/no-namespace */
import * as stream from 'stream';

export namespace Core {
  export interface InputOptions {
    required?: boolean;
    trimWhitespace?: boolean;
  }

  export enum ExitCode {
    Success = 0,
    Failure = 1
  }

  export interface AnnotationProperties {
    title?: string;
    file?: string;
    startLine?: number;
    endLine?: number;
    startColumn?: number;
    endColumn?: number;
  }

  export type exportVariable = (name: string, val: any) => void;
  export type setSecret = (secret: string) => void;
  export type addPath = (path: string) => void;
  export type getInput = (name: string, options?: InputOptions) => string;
  export type getMultilineInput = (name: string, options?: InputOptions) => string[];
  export type getBooleanInput = (name: string, options?: InputOptions) => boolean;
  export type setOutput = (name: string, value: any) => void;
  /**
   * Enable/disable echo for commands
   */
  export type setCommandEcho = (enabled: boolean) => void;
  export type setFailed = (message: string | Error) => void;

  export type startGroup = (name: string) => void;
  export type endGroup = (name: string) => void;
  export type debug = (message: string) => void;
  /** Adds error issue to CR */
  export type error = (message: string | Error, properties: AnnotationProperties) => void;
  /** Adds warning issue to CR */
  export type warning = (message: string | Error, properties: AnnotationProperties) => void;
  /** Adds notice issue to CR */
  export type notice = (message: string | Error, properties: AnnotationProperties) => void;
  export type group = <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  /** Saves state for current action */
  export type saveState = (name: string, value: any) => void;
  /** Gets state for current action */
  export type getState = (name: string) => string;
}

export namespace Cache {
  export interface UploadOptions {
    uploadConcurrency?: number;
    uploadChunkSize?: number;
  }

  export interface DownloadOptions {
    downloadConcurrency?: number;
    timeoutInMs?: number;
    segmentTimeoutInMs?: number;
    lookupOnly?: boolean;
  }

  /**
   * Restores cache from keys
   *
   * @param paths a list of file paths to restore from the cache
   * @param primaryKey an explicit key for restoring the cache
   * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
   * @param downloadOptions cache download options
   * @returns string returns the key for the cache hit, otherwise returns undefined
   */
  export type restoreCache = (
    paths: string[],
    primaryKey: string,
    restoreKeys?: string[],
    options?: DownloadOptions
  ) => Promise<string | undefined>;
  export type saveCache = (
    paths: string[],
    key: string,
    options?: UploadOptions
  ) => Promise<number>;
}

export namespace Artifact {
  export interface UploadOptions {
    continueOnError?: boolean;
    retentionDays?: number;
  }

  export interface UploadResponse {
    artifactName: string;
    artifactItems: string[];
    size: number;
    failedItems: string[];
  }

  export interface DownloadOptions {
    createArtifactFolder?: boolean;
  }

  export interface DownloadResponse {
    artifactName: string;
    downloadPath: string;
  }

  export type downloadArtifact = (
    name: string,
    path?: string | undefined,
    options?: DownloadOptions | undefined
  ) => Promise<DownloadResponse>;
  export type uploadArtifact = (
    name: string,
    files: string[],
    rootDirectory: string,
    options?: UploadOptions
  ) => Promise<UploadResponse>;
  export type downloadAllArtifacts = (path?: string) => Promise<DownloadResponse[]>;
}

export namespace io {
  export interface CopyOptions {
    recursive?: boolean;
    force?: boolean;
    copySourceDirectory?: boolean;
  }

  export interface MoveOptions {
    force?: boolean;
  }

  export type cp = (source: string, dest: string, options: CopyOptions) => Promise<void>;
  export type mv = (source: string, dest: string, options: MoveOptions) => Promise<void>;
  export type rmRF = (inputPath: string) => Promise<void>;
  export type mkdirP = (fsPath: string) => Promise<void>;
  export type which = (tool: string, check?: boolean) => Promise<string>;
  export type findInPath = (tool: string) => Promise<string[]>;
  export type exists = (fsPath: string) => Promise<boolean>;
  export type isDirectory = () => boolean;
  export type isRooted = (p: string) => boolean;
  export type tryGetExecutablePath = (filePath: string, extensions: string[]) => Promise<string>;
}

export namespace exec {
  export interface ExecOptions {
    cwd?: string;
    env?: { [key: string]: string };
    silent?: boolean;
    outStream?: stream.Writable;
    errStream?: stream.Writable;
    windowsVerbatimArguments?: boolean;
    failOnStdErr?: boolean;
    ignoreReturnCode?: boolean;
    delay?: number;
    input?: Buffer;
    listeners?: ExecListeners;
  }

  export interface ExecOutput {
    exitCode: number;
    stdout: string;
    stderr: string;
  }

  export interface ExecListeners {
    stdout?: (data: Buffer) => void;
    stderr?: (data: Buffer) => void;
    stdline?: (data: string) => void;
    errline?: (data: string) => void;
    debug?: (data: string) => void;
  }

  export type exec = (
    commandLine: string,
    args?: string[],
    options?: ExecOptions
  ) => Promise<number>;
  export type getExecOutput = (
    commandLine: string,
    args?: string[],
    options?: ExecOptions
  ) => Promise<ExecOutput>;
}
