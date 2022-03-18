import axios from 'axios';
import type { IUser } from 'interfaces';
import type { ILoggedUser } from '../user';

export async function getUserProfileFromUiService({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
}): Promise<IUser | undefined> {
  return (
    await axios.get(`${uiServiceBaseUrl}/api/v1/profile`, {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    })
  ).data;
}
