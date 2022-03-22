import type { IUIServiceDeviceConfig } from '@entity/device-config';
import axios from 'axios';
import type { ILoggedUser } from '../user';
import type { IUIServiceDevice } from './IUIServiceDevice';

export async function getDeviceConfigFromUiService({
  installer,
  device,
  policyId,
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
  policyId: string;
  device: IUIServiceDevice;
  installer: ILoggedUser;
}): Promise<IUIServiceDeviceConfig> {
  const { data: downloadButton } = await axios.get(
    `${uiServiceBaseUrl}/api/v1/policies/${policyId}/tag/download_config_btn`,
    {
      headers: {
        Authorization: `Api-Key ${installer.accessToken}`,
      },
    },
  );

  const deviceConfig = (
    await axios.post(
      `${uiServiceBaseUrl}/api/v1/policies/${policyId}/blocks/${downloadButton.id}`,
      {
        owner: device.owner,
        document: device.document,
      },
      {
        headers: {
          authorization: `Bearer ${installer.accessToken}`,
        },
      },
    )
  ).data.body;

  return deviceConfig;
}
