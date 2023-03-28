import { shell } from '@pipeline/process';
import { callbacks, context, info, step } from '@pipeline/core';

(async function () {
  info(`Console.log: Hello world!\n${JSON.stringify(step)}`);
  info(JSON.stringify(context.internal.env));
  await shell('ls && pwd');

  callbacks.sendOutput('sample', { a: 1, b: 2 });
  callbacks.addEnv('CHILD_ENV', '123');
  callbacks.addToPath('/home/root/.bin/binbin');
})();
