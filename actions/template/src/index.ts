import { shell } from '@pipeline/process';
import { callbacks, info, step } from '@pipeline/core';

(async function () {
  info(`Console.log: Hello world!\n${JSON.stringify(step)}`);
  await shell('ls && pwd');

  callbacks.sendOutput('sample', { a: 1, b: 2 });
  callbacks.addEnv('CHILD_ENV', '123');
  callbacks.addToPath('/home/root/.bin/binbin');
})();
