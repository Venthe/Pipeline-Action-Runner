import process from 'process';
import { ActionStepDefinition, ContextSnapshot } from '@pipeline/types';
import { EOL } from 'os';
import { error as _error } from '@pipeline/utilities';

export type Core = {
  context: ContextSnapshot;
  step: ActionStepDefinition;
  callbacks: {
    sendOutput: (key: string, value: any) => void;
    addEnv: (key: string, value: any) => void;
    addToPath: (path: string) => void;
  };
};

export type CoreArguments = [step: ActionStepDefinition, context: ContextSnapshot];

export enum MessageType {
  ADD_TO_PATH = 'addToPath',
  ADD_ENV = 'addEnv',
  SET_OUTPUT = 'setOutput'
}

export const { step, context, callbacks }: Core = (() => {
  const coreArgs = (): CoreArguments => {
    // FIXME: Do not expect for the params to be at the second place..
    try {
      return JSON.parse(process.argv[2] ?? '[{},{}]');
    } catch (e) {
      return [{}, {}] as CoreArguments;
    }
  };
  return {
    get step() {
      return coreArgs()[0];
    },
    get context() {
      return coreArgs()[1];
    },
    callbacks: {
      addToPath: (path: string) => {
        process.env['PATH'] = `${path}:${process.env['PATH']}`;
        return process.send?.(
          message<AddToPathMessage>({ type: MessageType.ADD_TO_PATH, content: path })
        );
      },
      addEnv: (env: string, value: string) => {
        process.env[env] = value;
        return process.send?.(
          message<AddEnvMessage>({ type: MessageType.ADD_ENV, content: { env, value } })
        );
      },
      sendOutput: (key: string, value: number | string) =>
        process.send?.(
          message<SetOutputMessage>({
            type: MessageType.SET_OUTPUT,
            content: { key, value }
          })
        )
    }
  };
})();

export interface Message<U extends MessageType, T> {
  type: U;
  content: T;
}

export type SetOutputMessage = Message<
  MessageType.SET_OUTPUT,
  { key: string; value: number | string }
>;
export type AddEnvMessage = Message<MessageType.ADD_ENV, { env: string; value: string }>;
export type AddToPathMessage = Message<MessageType.ADD_TO_PATH, string>;

const message = <T extends Message<MessageType, any>>(message: T): string =>
  JSON.stringify(message);

export const isDebug = () => process.env.PIPELINE_DEBUG === '1';
/** Writes to STDOUT */
export const info = (message: string) => {
  process.stdout.write(`${message}${EOL}`);
};
/** Writes to STDERR */
export const debug = (message: string) => {
  if (isDebug()) {
    process.stderr.write(`${message}${EOL}`);
  }
};
export const error = (message: string) => {
  process.stderr.write(`${_error(message)}${EOL}`);
};
