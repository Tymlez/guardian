// import assert from 'assert';
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
  schemaName = 'TymlezInstaller',
}: {
  policyPackage: PolicyPackage;
  guardianApiGatewayUrl: string;
  policyId: string;
  installerInfo: any;
  installer: ILoggedUser;
  schemaName: string;
}) {
  const installerSchema = policyPackage.schemas.find(
    (schema) =>
      schema.inputName.toLocaleLowerCase() === schemaName.toLocaleLowerCase(),
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
    (schema) =>
      schema.name?.toLocaleLowerCase() === schemaName.toLocaleLowerCase(),
  );

  await sendBlockDataWithRetry({
    guardianApiGatewayUrl,
    policyId,
    blockTag: 'choose_role_user_role',
    data: { role: 'INSTALLER' },
    user: installer,
  });

  //assert(installerSchema, `Cannot find ${schemaName} schema`);
  if (!installerSchema) {
    console.log('Skip setup installer as no schema found');
    return;
  }
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
