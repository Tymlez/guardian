import axios from 'axios';
import type { IUser } from 'interfaces';
import type { ILoggedUser } from './ILoggedUser';

export async function updateProfile({
  guardianApiGatewayUrl,
  user,
  profile,
}: {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
  profile: Partial<IUser>;
}) {
  await axios.put(
    `${guardianApiGatewayUrl}/api/v1/profiles/${user.username}`,
    {
      ...profile,
    },
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );
}
