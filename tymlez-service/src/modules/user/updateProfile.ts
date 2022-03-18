import axios from 'axios';
import type { IUser } from 'interfaces';
import type { ILoggedUser } from './ILoggedUser';

export async function updateProfile({
  uiServiceBaseUrl,
  user,
  profile,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
  profile: Partial<IUser>;
}) {
  await axios.put(
    `${uiServiceBaseUrl}/api/v1/profile`,
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
