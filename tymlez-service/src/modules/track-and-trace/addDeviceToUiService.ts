import { ILoggedUser, loginToUiService } from '../user';
import assert from 'assert';
import type { PolicyPackage } from '@entity/policy-package';
import { getAllSchemasFromUiService } from '../schema';
import { sendBlockDataWithRetry } from '../policy';

export async function addDeviceToUiService({
  policyPackage,
  installer,
  deviceInfo,
  policyId,
  guardianApiGatewayUrl,
}: {
  policyPackage: PolicyPackage;
  guardianApiGatewayUrl: string;
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
    guardianApiGatewayUrl,
    username: 'RootAuthority',
  });

  const allSchemas = await getAllSchemasFromUiService({
    guardianApiGatewayUrl,
    rootAuthority,
  });
  const actualDeviceSchema = allSchemas.find(
    (schema) => schema.name === 'TymlezDevice',
  );

  const updateDeviceData = {
    document: {
      type: actualDeviceSchema?.iri?.replace('#', ''),
      '@context': [actualDeviceSchema?.contextURL],
      ...deviceInfo,
    },
  };

  await sendBlockDataWithRetry({
    guardianApiGatewayUrl,
    policyId: policyPackage.policy.id,
    blockTag: 'add_sensor_bnt',
    user: installer,
    data: updateDeviceData,
  });
}
