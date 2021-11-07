import assert from 'assert';
import { promise as exec } from 'exec-sh';
import { resolve } from 'path';
import { getConfig } from '../getConfig';

export async function deploy() {
  assert(process.env.ENV, `ENV is missing`);
  assert(process.env.ENV !== 'local', `Cannot deploy to local`);

  const { GCP_PROJECT_ID, GUARDIAN_MONGO_USERNAME, GUARDIAN_MONGO_PASSWORD } =
    await getConfig({ env: process.env.ENV });

  assert(GCP_PROJECT_ID, `GCP_PROJECT_ID is missing`);
  assert(GUARDIAN_MONGO_USERNAME, `GUARDIAN_MONGO_USERNAME is missing`);
  assert(GUARDIAN_MONGO_PASSWORD, `GUARDIAN_MONGO_PASSWORD is missing`);

  const imageTag = process.env.GIT_TAG ?? Date.now().toString();

  await pushImages({
    gcpProjectId: GCP_PROJECT_ID,
    imageTag,
  });

  // Paul Debug
  const GKE_CLUSTER = 'guardian-paul1';
  const GEK_REGION = 'australia-southeast1';

  await exec(
    [
      'gcloud',
      'container',
      'clusters',
      'get-credentials',
      GKE_CLUSTER,
      '--region',
      GEK_REGION,
    ].join(' '),
  );

  await exec(['helm', 'dependency', 'update'].join(' '), {
    cwd: resolve(__dirname, 'charts/guardian-root'),
  });

  await exec(
    [
      'helm',
      'upgrade',
      '--install',
      '--debug',
      `tymlez-guardian-${process.env.ENV}`,
      '.',

      `--set-string mongodb.auth.rootUser="${GUARDIAN_MONGO_USERNAME}"`,
      `--set-string mongodb.auth.rootPassword="${GUARDIAN_MONGO_PASSWORD}"`,

      `--set-string guardian-message-broker.image.tag="${imageTag}"`,
      `--set-string guardian-message-broker.configmap.data.DEPLOY_VERSION="${imageTag}"`,

      `--set-string guardian-service.image.tag="${imageTag}"`,
      `--set-string guardian-service.configmap.data.DB_USER="${GUARDIAN_MONGO_USERNAME}"`,
      `--set-string guardian-service.configmap.data.DB_PASSWORD="${GUARDIAN_MONGO_PASSWORD}"`,
      `--set-string guardian-service.configmap.data.DEPLOY_VERSION="${imageTag}"`,

      `--set-string guardian-ui-service.image.tag="${imageTag}"`,
      `--set-string guardian-ui-service.configmap.data.DB_USER="${GUARDIAN_MONGO_USERNAME}"`,
      `--set-string guardian-ui-service.configmap.data.DB_PASSWORD="${GUARDIAN_MONGO_PASSWORD}"`,
      `--set-string guardian-ui-service.configmap.data.DEPLOY_VERSION="${imageTag}"`,

      // '--dry-run',
    ].join(' '),
    {
      cwd: resolve(__dirname, 'charts/guardian-root'),
    },
  );
}

async function pushImages({
  gcpProjectId,
  imageTag,
}: {
  gcpProjectId: string;
  imageTag: string;
}) {
  console.log('Pushing images to ', { gcpProjectId, imageTag });

  await pushImage({
    gcpProjectId,
    imageName: 'guardian-message-broker',
    imageTag,
  });

  await pushImage({
    gcpProjectId,
    imageName: 'guardian-service',
    imageTag,
  });

  await pushImage({
    gcpProjectId,
    imageName: 'guardian-ui-service',
    imageTag,
  });

  await pushImage({
    gcpProjectId,
    imageName: 'guardian-mrv-sender',
    imageTag,
  });
}

async function pushImage({
  gcpProjectId,
  imageName,
  imageTag,
}: {
  gcpProjectId: string;
  imageName: string;
  imageTag: string;
}) {
  await exec(
    [
      `docker`,
      `tag`,
      imageName,
      `asia.gcr.io/${gcpProjectId}/${imageName}:${imageTag}`,
    ].join(' '),
  );

  await exec(
    [
      `docker`,
      `push`,
      `asia.gcr.io/${gcpProjectId}/${imageName}:${imageTag}`,
    ].join(' '),
  );

  await exec(
    [
      `docker`,
      `tag`,
      imageName,
      `asia.gcr.io/${gcpProjectId}/${imageName}:latest`,
    ].join(' '),
  );

  await exec(
    [`docker`, `push`, `asia.gcr.io/${gcpProjectId}/${imageName}:latest`].join(
      ' ',
    ),
  );
}
