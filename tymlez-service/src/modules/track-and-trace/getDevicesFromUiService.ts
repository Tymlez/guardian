import axios from 'axios';
import type { ILoggedUser } from '../user';
import type { IUIServiceDevice } from './IUIServiceDevice';

export async function getDevicesFromUiService({
  guardianApiGatewayUrl,
  policyId,
  installer,
}: {
  guardianApiGatewayUrl: string;
  policyId: string;
  installer: ILoggedUser;
}): Promise<IUIServiceDevice[]> {
  const { data: sensorGridId } = await axios.get(
    `${guardianApiGatewayUrl}/api/v1/policies/${policyId}/tag/sensors_grid`,
    {
      headers: {
        Authorization: `Api-Key ${installer.accessToken}`,
      },
    },
  );

  const {
    data: { data: devices },
  } = await axios.get(
    `${guardianApiGatewayUrl}/api/v1/policies/${policyId}/blocks/${sensorGridId.id}`,
    {
      headers: {
        authorization: `Bearer ${installer.accessToken}`,
      },
    },
  );
  console.log('devices', devices);

  return devices;
}
