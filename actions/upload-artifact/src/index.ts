import { context, debug, RepositoryType, step, upload } from '@pipeline/core';
import { throwThis } from '@pipeline/utilities';
import { ActionStepDefinition } from '@pipeline/types';

(async function () {
  const stepDefinition = step as ActionStepDefinition<{ sourcePath: string; targetPath?: string }>;

  debug(`${JSON.stringify(step)}\n
        ${JSON.stringify(stepDefinition)}\n
        ${JSON.stringify(stepDefinition.with)}\n
        ${JSON.stringify(stepDefinition.with?.targetPath)}\n
        ${JSON.stringify(stepDefinition.with?.sourcePath)}
    `);
  await upload({
    sourcePath: stepDefinition.with?.sourcePath ?? throwThis('Source path should be present'),
    targetPath: stepDefinition.with?.targetPath,
    context: context,
    type: RepositoryType.User
  });
})();
