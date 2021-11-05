import { promise as exec } from 'exec-sh';

export async function deploy() {
  console.log('Paul Debug: deploy');

  // Paul Debug: need to be dynamic
  const projectId = 'tymlez-platform-328903';
  const imageTag = process.env.GIT_TAG ?? Date.now().toString();

  await pushImage({
    projectId,
    imageName: 'guardian-message-broker',
    imageTag,
  });

  await pushImage({
    projectId,
    imageName: 'guardian-service',
    imageTag,
  });

  // await pushImage({
  //   projectId,
  //   imageName: 'guardian-ui-service',
  //   imageTag,
  // });

  // await pushImage({
  //   projectId,
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
