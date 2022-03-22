import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function publishPolicyToUiService(
  {
    policyId,
    rootAuthority,
    uiServiceBaseUrl,
    policyVersion,
  }: {
    policyId: string;
    uiServiceBaseUrl: string;
    rootAuthority: ILoggedUser;
    policyVersion: string;
  },
  retry = 0,
) {
  try {
    await axios.put(
      `${uiServiceBaseUrl}/api/v1/policies/${policyId}/publish`,
      { policyVersion },
      {
        headers: {
          authorization: `Bearer ${rootAuthority.accessToken}`,
        },
      },
    );
  } catch (error) {
    if (retry < 3) {
      await publishPolicyToUiService(
        {
          policyId,
          rootAuthority,
          uiServiceBaseUrl,
          policyVersion,
        },
        retry + 1,
      );
    }
  }
}
