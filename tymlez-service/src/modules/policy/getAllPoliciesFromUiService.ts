import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function getAllPoliciesFromUiService(
  guardianApiGatewayUrl: string,
  rootAuthority: ILoggedUser,
) {
  return (
    await axios.get(`${guardianApiGatewayUrl}/api/v1/policies`, {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    })
  ).data as IPolicy[];
}

export interface IPolicy {
  id: string;
  status?: string;
  name: string;
  policyTag: string;
  config?: {
    id: string;
  };
}
