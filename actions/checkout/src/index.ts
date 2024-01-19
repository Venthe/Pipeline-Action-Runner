import { checkoutCommands, context } from '@pipeline/core';
import { shellMany } from '@pipeline/process';

(async () => {
  if (context.env.PIPELINE_VERSION_CONTROL_TYPE !== 'ssh') {
    throw new Error()
  }
  
  if (!(context.internal.event as any).metadata?.projectName) {
    // FIME: Use projectName from the context
    throw new Error();
  }

  const projectUrl = `${context.internal.projectUrl}/${(context.internal.event as any).metadata.projectName}`;
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
