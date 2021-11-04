import assert from 'assert';
import { getParameters } from './getParameters';

export const getConfig = async ({ env }: { env: string }): Promise<IConfig> => {
  assert(
    env === 'local' || env === 'dev' || env === 'prod',
    `Unsupported env: '${env}'.`,
  );

  const [GUARDIAN_OPERATOR_ID, GUARDIAN_OPERATOR_KEY] = await getParameters([
    `/${env === 'prod' ? 'prod' : 'dev'}/tymlez-platform/guardian-operator-id`,
    `/${env === 'prod' ? 'prod' : 'dev'}/tymlez-platform/guardian-operator-key`,
  ]);

  assert(GUARDIAN_OPERATOR_ID, `Failed to load GUARDIAN_OPERATOR_ID from SSM`);
  assert(
    GUARDIAN_OPERATOR_KEY,
    `Failed to load GUARDIAN_OPERATOR_KEY from SSM`,
  );

  return {
    GUARDIAN_OPERATOR_ID,
    GUARDIAN_OPERATOR_KEY,
  };
};

interface IConfig {
  GUARDIAN_OPERATOR_ID: string;
  GUARDIAN_OPERATOR_KEY: string;
}
