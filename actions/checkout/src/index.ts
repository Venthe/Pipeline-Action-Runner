import { checkoutCommands, context } from '@pipeline/core';
import { shellMany } from '@pipeline/process';

(async () => {
  if (context.env.PIPELINE_VERSION_CONTROL_TYPE !== 'ssh') {
    throw new Error()
  }

  const projectUrl = `ssh://${context.env.PIPELINE_VERSION_CONTROL_SSH_USERNAME}@${context.env.PIPELINE_VERSION_CONTROL_SSH_HOST}:${context.env.PIPELINE_VERSION_CONTROL_SSH_PORT}/${context.internal.repository}`;
  const event: any = context.internal.event;
  await shellMany(
    checkoutCommands({
      repository: projectUrl,
      revision: event.metadata.revision,
      options: {
        depth: 1,
        branchName: event.metadata.branchName
      }
    })
  );
})();
