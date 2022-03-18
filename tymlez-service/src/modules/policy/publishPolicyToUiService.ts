import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function publishPolicyToUiService({
  policyId,
  rootAuthority,
  uiServiceBaseUrl,
  policyVersion,
}: {
  policyId: string;
  uiServiceBaseUrl: string;
  rootAuthority: ILoggedUser;
  policyVersion: string;
}) {
  await axios.put(
    `${uiServiceBaseUrl}/api/v1/policies/${policyId}/publish`,
    { policyVersion },
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  );
}
