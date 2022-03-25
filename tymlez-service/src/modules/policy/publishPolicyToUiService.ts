import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function publishPolicyToUiService(
  {
    policyId,
    rootAuthority,
    guardianApiGatewayUrl,
    policyVersion,
  }: {
    policyId: string;
    guardianApiGatewayUrl: string;
    rootAuthority: ILoggedUser;
    policyVersion: string;
  },
  retry = 0,
) {
  try {
    await axios.put(
      `${guardianApiGatewayUrl}/api/v1/policies/${policyId}/publish`,
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
          guardianApiGatewayUrl,
          policyVersion,
        },
        retry + 1,
      );
    }
  }
}
