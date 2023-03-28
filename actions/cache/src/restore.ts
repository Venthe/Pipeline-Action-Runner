import { info, step } from '@pipeline/core';
import { ActionStepDefinition } from '@pipeline/types';
import { CommonWith } from './types';

type With = {
  path: string;
  key: string;
} & CommonWith;

const run = async () => {
  const _with: With = (step as ActionStepDefinition<With>).with ?? ({} as With);
  info(`CACHE: Restore\n${JSON.stringify(_with)}`);
};

run();

export default run;
