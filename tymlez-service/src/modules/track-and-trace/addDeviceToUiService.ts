import axios from 'axios';
import { ILoggedUser, loginToUiService } from '../user';
import assert from 'assert';
import type { PolicyPackage } from '@entity/policy-package';
import { getAllSchemasFromUiService } from '../schema';

export async function addDeviceToUiService({
  policyPackage,
  installer,
  deviceInfo,
  policyId,
  uiServiceBaseUrl,
}: {
  policyPackage: PolicyPackage;
  uiServiceBaseUrl: string;
  policyId: string;
  deviceInfo: any;
  installer: ILoggedUser;
}): Promise<void> {
  const inverterSchema = policyPackage.schemas.find(
    (schema) => schema.inputName === 'TymlezDevice',
  );

  assert(inverterSchema, `Cannot find TymlezDevice schema`);

  console.log('Adding device to UI Service', {
    installer: installer.username,
    inverterSchema: inverterSchema.inputName,
    deviceInfo,
    policyId,
  });

  const rootAuthority = await loginToUiService({
    uiServiceBaseUrl,
    username: 'RootAuthority',
  });

  const allSchemas = await getAllSchemasFromUiService({
    uiServiceBaseUrl,
    rootAuthority,
  });
  const actualDeviceSchema = allSchemas.find(
    (schema) => schema.name === 'TymlezDevice',
  );

  const { data: addSensorBtnId } = await axios.get(
    `${uiServiceBaseUrl}/api/v1/policies/${policyPackage.policy.id}/tag/add_sensor_bnt`,
    {
      headers: {
        Authorization: `Api-Key ${installer.accessToken}`,
      },
    },
  );

  const updateDeviceData = {
    document: {
      type: actualDeviceSchema?.iri?.replace('#', ''),
      '@context': [actualDeviceSchema?.contextURL],
      ...deviceInfo,
    },
  };
  console.log('updateDeviceData', updateDeviceData);
  await axios.post(
    `${uiServiceBaseUrl}/api/v1/policies/${policyId}/blocks/${addSensorBtnId.id}`,
    updateDeviceData,
    {
      headers: {
        authorization: `Bearer ${installer.accessToken}`,
      },
    },
  );
}
