import axios from 'axios';
import type { IUser } from 'interfaces';
import type { ILoggedUser } from '../user';

export async function getUserProfileFromUiService({
  guardianApiGatewayUrl,
  user,
}: {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
}): Promise<IUser | undefined> {
  return (
    await axios.get(
      `${guardianApiGatewayUrl}/api/v1/profiles/${user.username}`,
      {
        headers: {
          authorization: `Bearer ${user.accessToken}`,
        },
      },
    )
  ).data;
}
