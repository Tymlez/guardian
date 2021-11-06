import assert from 'assert';
import { promise as exec } from 'exec-sh';
import { getConfig } from './getConfig';

export async function deploy() {
  assert(process.env.ENV, `ENV is missing`);
  assert(process.env.ENV !== 'local', `Cannot deploy to local`);

  const { GCP_PROJECT_ID } = await getConfig({ env: process.env.ENV });
  assert(GCP_PROJECT_ID, `GCP_PROJECT_ID is missing`);

  const imageTag = process.env.GIT_TAG ?? Date.now().toString();

  await pushImage({
    projectId: GCP_PROJECT_ID,
    imageName: 'guardian-message-broker',
    imageTag,
  });

  await pushImage({
    projectId: GCP_PROJECT_ID,
    imageName: 'guardian-service',
    imageTag,
  });

  // Paul Debug
  // await pushImage({
  //   projectId: GCP_PROJECT_ID,
  //   imageName: 'guardian-ui-service',
  //   imageTag,
  // });

  // await pushImage({
  //   projectId: GCP_PROJECT_ID,
  //   imageName: 'guardian-mrv-sender',
  //   imageTag,
  // });
}

async function pushImage({
  projectId,
  imageName,
  imageTag,
}: {
  projectId: string;
  imageName: string;
  imageTag: string;
}) {
  await exec(
    [
      `docker`,
      `tag`,
      imageName,
      `asia.gcr.io/${projectId}/${imageName}:${imageTag}`,
    ].join(' '),
  );

  await exec(
    [
      `docker`,
      `push`,
      `asia.gcr.io/${projectId}/${imageName}:${imageTag}`,
    ].join(' '),
  );
}
