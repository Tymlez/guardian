import { promise as exec } from 'exec-sh';

export async function deploy() {
  console.log('Paul Debug: deploy');

  const projectId = 'tymlez-platform-328903';

  await exec(
    [
      `docker`,
      `tag`,
      `guardian-message-broker`,
      `asia.gcr.io/${projectId}/guardian-message-broker`,
    ].join(' '),
  );

  await exec(
    [`docker`, `push`, `asia.gcr.io/${projectId}/guardian-message-broker`].join(
      ' ',
    ),
  );

  await exec(
    [
      `docker`,
      `tag`,
      `guardian-service`,
      `asia.gcr.io/${projectId}/guardian-service`,
    ].join(' '),
  );
  await exec(
    [`docker`, `push`, `asia.gcr.io/${projectId}/guardian-service`].join(' '),
  );

  await exec(
    [
      `docker`,
      `tag`,
      `guardian-mrv-sender`,
      `asia.gcr.io/${projectId}/guardian-mrv-sender`,
    ].join(' '),
  );

  await exec(
    [`docker`, `push`, `asia.gcr.io/${projectId}/guardian-mrv-sender`].join(
      ' ',
    ),
  );

  await exec(
    [
      `docker`,
      `tag`,
      `guardian-ui-service`,
      `asia.gcr.io/${projectId}/guardian-ui-service`,
    ].join(' '),
  );

  await exec(
    [`docker`, `push`, `asia.gcr.io/${projectId}/guardian-ui-service`].join(
      ' ',
    ),
  );
}
