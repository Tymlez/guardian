import axios from 'axios';
import type { ILoggedUser } from '../user';
import type { IUIServiceDevice } from './IUIServiceDevice';

export async function getDevicesFromUiService({
  uiServiceBaseUrl,
  policyId,
  installer,
}: {
  uiServiceBaseUrl: string;
  policyId: string;
  installer: ILoggedUser;
}): Promise<IUIServiceDevice[]> {
  const { data: sensorGridId } = await axios.get(
    `${uiServiceBaseUrl}/api/v1/policies/${policyId}/tag/sensors_grid`,
    {
      headers: {
        Authorization: `Api-Key ${installer.accessToken}`,
      },
    },
  );

  const {
    data: { data: devices },
  } = await axios.get(
    `${uiServiceBaseUrl}/api/v1/policies/${policyId}/blocks/${sensorGridId.id}`,
    {
      headers: {
        authorization: `Bearer ${installer.accessToken}`,
      },
    },
  );

  return devices;
}
