import type { ILoggedUser } from '../user';
import { getDevicesFromUiService } from './getDevicesFromUiService';

export async function waitForDeviceAdded({
  installer,
  policyId,
  deviceId,
  guardianApiGatewayUrl,
}: {
  guardianApiGatewayUrl: string;
  policyId: string;
  installer: ILoggedUser;
  deviceId: string;
}) {
  while (true) {
    const all = await getDevicesFromUiService({
      guardianApiGatewayUrl,
      policyId,
      installer,
    });
    const device = all.find((device) =>
      device.document.credentialSubject.some((x) => x.deviceId === deviceId),
    );
    if (device) {
      return device;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
