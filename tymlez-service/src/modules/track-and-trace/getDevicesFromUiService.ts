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
  const {
    data: { data: devices },
  } = await axios.get(
    `${uiServiceBaseUrl}/policy/block/tag2/${policyId}/sensors_grid`,
    {
      headers: {
        authorization: `Bearer ${installer.accessToken}`,
      },
    },
  );

  return devices;
}
