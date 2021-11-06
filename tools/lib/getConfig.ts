import assert from 'assert';
import { getParameters } from './getParameters';

export const getConfig = async ({ env }: { env: string }): Promise<IConfig> => {
  assert(
    env === 'local' || env === 'dev' || env === 'prod',
    `Unsupported env: '${env}'.`,
  );

  const { GUARDIAN_OPERATOR_ID, GUARDIAN_OPERATOR_KEY } = await getOperatorInfo(
    env,
  );

  assert(GUARDIAN_OPERATOR_ID, `GUARDIAN_OPERATOR_ID is missing`);
  assert(GUARDIAN_OPERATOR_KEY, `GUARDIAN_OPERATOR_KEY is missing`);

  if (env !== 'local') {
    const [GCP_PROJECT_ID] = await getParameters([
      `/${env}/tymlez-platform/gcp-project-id`,
    ]);

    return {
      GUARDIAN_OPERATOR_ID,
      GUARDIAN_OPERATOR_KEY,
      GCP_PROJECT_ID,
    };
  }

  return {
    GUARDIAN_OPERATOR_ID,
    GUARDIAN_OPERATOR_KEY,
  };
};

async function getOperatorInfo(env: string) {
  if (env !== 'local') {
    const [GUARDIAN_OPERATOR_ID, GUARDIAN_OPERATOR_KEY] = await getParameters([
      `/${env}/tymlez-platform/guardian-operator-id`,
      `/${env}/tymlez-platform/guardian-operator-key`,
    ]);

    return {
      GUARDIAN_OPERATOR_ID,
      GUARDIAN_OPERATOR_KEY,
    };
  } else {
    return {
      GUARDIAN_OPERATOR_ID: process.env.GUARDIAN_OPERATOR_ID,
      GUARDIAN_OPERATOR_KEY: process.env.GUARDIAN_OPERATOR_KEY,
    };
  }
}

interface IConfig {
  GUARDIAN_OPERATOR_ID: string;
  GUARDIAN_OPERATOR_KEY: string;
  GCP_PROJECT_ID?: string;
}
