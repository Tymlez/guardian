import assert from 'assert';
import axios from 'axios';
import { ILoggedUser, loginToUiService } from '../user';
import type { PolicyPackage } from '@entity/policy-package';
import { getAllSchemasFromUiService } from '../schema';

export async function registerInstallerInUiService({
  installer,
  installerInfo,
  policyId,
  policyPackage,
  uiServiceBaseUrl,
}: {
  policyPackage: PolicyPackage;
  uiServiceBaseUrl: string;
  policyId: string;
  installerInfo: any;
  installer: ILoggedUser;
}) {
  const installerSchema = policyPackage.schemas.find(
    (schema) => schema.inputName === 'TymlezInstaller',
  );

  const rootAuthority = await loginToUiService({
    uiServiceBaseUrl,
    username: 'RootAuthority',
  });

  const allSchemas = await getAllSchemasFromUiService({
    uiServiceBaseUrl,
    rootAuthority,
  });
  const actualInstallerSchema = allSchemas.find(
    (schema) => schema.name === 'TymlezInstaller',
  );

  const { data: addNewInstallerId } = await axios.get(
    `${uiServiceBaseUrl}/api/v1/policies/${policyPackage.policy.id}/tag/add_new_installer_request`,
    {
      headers: {
        Authorization: `Api-Key ${installer.accessToken}`,
      },
    },
  );
  console.log('add_new_installer_request block id', addNewInstallerId);
  assert(installerSchema, `Cannot find TymlezInstaller schema`);

  const updateBlockData = {
    document: {
      type: actualInstallerSchema?.iri?.replace('#', ''),
      '@context': [actualInstallerSchema?.contextURL],
      ...installerInfo,
    },
  };
  console.log('updateBlockData', updateBlockData);
  await axios.post(
    `${uiServiceBaseUrl}/api/v1/policies/${policyId}/blocks/${addNewInstallerId.id}`,
    updateBlockData,
    {
      headers: {
        Authorization: `Api-Key ${installer.accessToken}`,
      },
    },
  );
}
