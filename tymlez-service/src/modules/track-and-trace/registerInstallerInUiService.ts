import assert from 'assert';
import { ILoggedUser, loginToUiService } from '../user';
import type { PolicyPackage } from '@entity/policy-package';
import { getAllSchemasFromUiService } from '../schema';
import { sendBlockDataWithRetry } from '../policy';

export async function registerInstallerInUiService({
  installer,
  installerInfo,
  policyId,
  policyPackage,
  guardianApiGatewayUrl,
}: {
  policyPackage: PolicyPackage;
  guardianApiGatewayUrl: string;
  policyId: string;
  installerInfo: any;
  installer: ILoggedUser;
}) {
  const installerSchema = policyPackage.schemas.find(
    (schema) => schema.inputName === 'TymlezInstaller',
  );

  const rootAuthority = await loginToUiService({
    guardianApiGatewayUrl,
    username: 'RootAuthority',
  });

  const allSchemas = await getAllSchemasFromUiService({
    guardianApiGatewayUrl,
    rootAuthority,
  });
  const actualInstallerSchema = allSchemas.find(
    (schema) => schema.name === 'TymlezInstaller',
  );

  await sendBlockDataWithRetry({
    guardianApiGatewayUrl,
    policyId,
    blockTag: 'choose_role_user_role',
    data: { role: 'INSTALLER' },
    user: installer,
  });

  assert(installerSchema, `Cannot find TymlezInstaller schema`);

  await sendBlockDataWithRetry({
    guardianApiGatewayUrl,
    policyId,
    blockTag: 'add_new_installer_request',
    data: {
      document: {
        type: actualInstallerSchema?.iri?.replace('#', ''),
        '@context': [actualInstallerSchema?.contextURL],
        ...installerInfo,
      },
    },
    user: installer,
  });
}
