import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function getPolicyRootBlocks(
  guardianApiGatewayUrl: string,
  user: ILoggedUser,
  policyId: string,
) {
  return (
    await axios.get(
      `${guardianApiGatewayUrl}/api/v1/policies/${policyId}/blocks`,
      {
        headers: {
          authorization: `Bearer ${user.accessToken}`,
        },
      },
    )
  ).data;
}
